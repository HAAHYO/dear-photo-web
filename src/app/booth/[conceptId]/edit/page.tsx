"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getConceptDetail, getConceptStickers } from "@/shared/api/concepts";
import { uploadPhotoDraft, fetchPhotoBlob } from "@/shared/api/photos";
import { CAPTURE_STORAGE_KEY } from "@/shared/config/storageKeys";
import { Button } from "@/shared/ui/Button";
import { useAuth } from "@/shared/auth/AuthContext";
import { saveDiaryEntry } from "@/shared/api/diary";
import { PostmarkStamp } from "@/shared/ui/PostmarkStamp";
import {
  getPhotoLayout,
  frameHeightFor,
  slotWidthFor,
  FRAME_W,
  PAD,
  GAP,
} from "@/shared/config/photoLayouts";

const CANVAS_SCALE = 2;
const FALLBACK_FRAME_COLOR = "#E85D4E";
const DEFAULT_BRUSH_COLOR = "#26221F";

type BrushType = "pen" | "marker" | "highlighter" | "eraser";

const BRUSH_TYPES: { type: BrushType; label: string; emoji: string }[] = [
  { type: "pen", label: "펜", emoji: "🖊️" },
  { type: "marker", label: "마카", emoji: "🖌️" },
  { type: "highlighter", label: "형광펜", emoji: "🖍️" },
  { type: "eraser", label: "지우개", emoji: "🧽" },
];

type PlacedSticker = {
  id: string;
  imageUrl: string;
  xPct: number;
  yPct: number;
};

type CaptureData = { conceptId: number; shots: string[]; layoutId?: string };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// object-fit: cover와 동일하게, 원본 비율을 유지한 채 중앙을 기준으로 잘라서 그린다
// (그냥 drawImage(dw, dh)로 늘려 그리면 사진이 찌부러져 보인다)
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource & { width: number; height: number },
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const sourceRatio = img.width / img.height;
  const targetRatio = dw / dh;

  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (sourceRatio > targetRatio) {
    // 원본이 더 넓다 → 좌우를 잘라낸다
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    // 원본이 더 좁다(세로로 길다) → 위아래를 잘라낸다
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

export default function EditPage() {
  const params = useParams<{ conceptId: string }>();
  const conceptId = Number(params.conceptId);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const { data: concept } = useQuery({
    queryKey: ["concept", conceptId],
    queryFn: () => getConceptDetail(conceptId),
    enabled: Number.isFinite(conceptId),
    retry: false,
  });
  const { data: stickers } = useQuery({
    queryKey: ["concept", conceptId, "stickers"],
    queryFn: () => getConceptStickers(conceptId),
    enabled: Number.isFinite(conceptId),
    retry: false,
  });

  const [capture, setCapture] = useState<CaptureData | null>(null);
  const [tab, setTab] = useState<"sticker" | "draw">("sticker");
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [brushColor, setBrushColor] = useState(DEFAULT_BRUSH_COLOR);
  const [brushSize, setBrushSize] = useState(4);
  const [brushType, setBrushType] = useState<BrushType>("pen");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const isPointerDown = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const layout = useMemo(() => getPhotoLayout(capture?.layoutId), [capture?.layoutId]);
  const frameH = frameHeightFor(layout);

  useEffect(() => {
    const raw = sessionStorage.getItem(CAPTURE_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as CaptureData;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 세션스토리지에서 촬영본을 읽어와 하이드레이션한다
      if (parsed.conceptId === conceptId) setCapture(parsed);
    } catch {
      // 저장된 값이 손상됐다면 무시하고 "촬영한 사진이 없어요" 상태로 둔다
    }
  }, [conceptId]);

  // 촬영본 + 프레임을 베이스 캔버스에 그린다
  useEffect(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas || !capture) return;

    canvas.width = FRAME_W * CANVAS_SCALE;
    canvas.height = frameH * CANVAS_SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pad = PAD * CANVAS_SCALE;
    const gap = GAP * CANVAS_SCALE;
    const slotW = slotWidthFor(layout) * CANVAS_SCALE;
    const slotH = layout.slotH * CANVAS_SCALE;

    async function render() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const photos = await Promise.all(capture!.shots.map(loadImage));
      photos.forEach((img, i) => {
        const col = i % layout.cols;
        const row = Math.floor(i / layout.cols);
        const x = pad + col * (slotW + gap);
        const y = pad + row * (slotH + gap);
        drawImageCover(ctx, img, x, y, slotW, slotH);
      });

      if (concept?.frameImageUrl) {
        try {
          const frame = await loadImage(concept.frameImageUrl);
          ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
          return;
        } catch {
          // 프레임 이미지 로드 실패 시 기본 테두리로 대체
        }
      }

      ctx.strokeStyle = FALLBACK_FRAME_COLOR;
      ctx.lineWidth = 3 * CANVAS_SCALE;
      const inset = 8 * CANVAS_SCALE;
      ctx.strokeRect(inset, inset, canvas.width - inset * 2, canvas.height - inset * 2);

      const label = `DEAR, PHOTO · ${concept?.name ?? ""}`;
      ctx.font = `${11 * CANVAS_SCALE}px sans-serif`;
      const textW = ctx.measureText(label).width;
      const boxPad = 8 * CANVAS_SCALE;
      const boxX = 20 * CANVAS_SCALE;
      const boxY = canvas.height - 36 * CANVAS_SCALE;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(boxX, boxY, textW + boxPad * 2, 22 * CANVAS_SCALE);
      ctx.fillStyle = FALLBACK_FRAME_COLOR;
      ctx.fillText(label, boxX + boxPad, boxY + 15 * CANVAS_SCALE);
    }

    render();
  }, [capture, concept, frameH, layout]);

  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    canvas.width = FRAME_W * CANVAS_SCALE;
    canvas.height = frameH * CANVAS_SCALE;
  }, [frameH]);

  function toCanvasPoint(e: React.PointerEvent) {
    const canvas = drawCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handleDrawStart(e: React.PointerEvent) {
    if (tab !== "draw") return;
    isPointerDown.current = true;
    lastPoint.current = toCanvasPoint(e);
  }

  function handleDrawMove(e: React.PointerEvent) {
    if (tab !== "draw" || !isPointerDown.current) return;
    const canvas = drawCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    const point = toCanvasPoint(e);
    if (!ctx || !point || !lastPoint.current) return;

    ctx.save();
    ctx.lineJoin = "round";
    if (brushType === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 1;
      ctx.lineCap = "round";
      ctx.lineWidth = brushSize * 1.5 * CANVAS_SCALE;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = brushColor;
      if (brushType === "highlighter") {
        ctx.globalAlpha = 0.35;
        ctx.lineCap = "butt";
        ctx.lineWidth = brushSize * 2.2 * CANVAS_SCALE;
      } else if (brushType === "marker") {
        ctx.globalAlpha = 0.9;
        ctx.lineCap = "round";
        ctx.lineWidth = brushSize * 1.4 * CANVAS_SCALE;
      } else {
        ctx.globalAlpha = 1;
        ctx.lineCap = "round";
        ctx.lineWidth = brushSize * CANVAS_SCALE;
      }
    }
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.restore();
    lastPoint.current = point;
  }

  function handleDrawEnd() {
    isPointerDown.current = false;
    lastPoint.current = null;
  }

  function addSticker(imageUrl: string) {
    setPlacedStickers((prev) => [
      ...prev,
      { id: `${imageUrl}-${Date.now()}`, imageUrl, xPct: 50, yPct: 50 },
    ]);
  }

  function handleFramePointerMove(e: React.PointerEvent) {
    if (!draggingId || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const xPct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setPlacedStickers((prev) =>
      prev.map((s) => (s.id === draggingId ? { ...s, xPct, yPct } : s))
    );
  }

  async function composeFinalImageBlob(): Promise<Blob | null> {
    const base = baseCanvasRef.current;
    const draw = drawCanvasRef.current;
    if (!base || !draw) return null;

    const out = document.createElement("canvas");
    out.width = base.width;
    out.height = base.height;
    const ctx = out.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(base, 0, 0);
    ctx.drawImage(draw, 0, 0);

    for (const s of placedStickers) {
      try {
        const img = await loadImage(s.imageUrl);
        const size = 44 * CANVAS_SCALE;
        ctx.drawImage(
          img,
          (s.xPct / 100) * out.width - size / 2,
          (s.yPct / 100) * out.height - size / 2,
          size,
          size
        );
      } catch {
        // 스티커 이미지 로드 실패 시 건너뛴다
      }
    }

    return new Promise((resolve) => out.toBlob((blob) => resolve(blob), "image/png"));
  }

  async function uploadDraft(): Promise<number | null> {
    const blob = await composeFinalImageBlob();
    if (!blob) {
      toast.error("사진을 완성할 수 없어요.");
      return null;
    }
    const draft = await uploadPhotoDraft(blob, conceptId);
    return draft.id;
  }

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const photoId = await uploadDraft();
      if (!photoId) return;
      const blob = await fetchPhotoBlob(photoId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dear-photo-${conceptId}-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("사진을 다운로드했어요.");
    } catch (error) {
      toast.error("다운로드에 실패했어요.", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleSaveToDiary() {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }
    if (!content.trim()) {
      toast.error("오늘의 한 줄을 적어주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const photoId = await uploadDraft();
      if (!photoId) return;
      await saveDiaryEntry(user.id, { photoId, content: content.trim() });
      toast.success("다이어리에 저장했어요.");
      router.push("/diary");
    } catch (error) {
      toast.error("다이어리 저장에 실패했어요.", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (!capture) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="font-bold text-ink-soft">
          촬영한 사진이 없어요. 먼저 포토부스에서 촬영해주세요.
        </p>
        <Link href="/" className="font-bold text-coral-dark">
          컨셉 선택으로 가기
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      <div className="mail-dot-bg flex flex-1 flex-col items-center px-4 py-9">
        <Link
          href={`/booth/${conceptId}/capture`}
          className="mb-6 flex w-full max-w-4xl items-center gap-2 px-4 text-sm font-bold text-ink-soft lg:px-12"
        >
          <span>←</span>
          <span>다시 촬영</span>
        </Link>

        {/* 소포 사진: 프레임 + 테이프 + 소인 스탬프 */}
        <div className="relative w-full" style={{ maxWidth: FRAME_W }}>
          <div
            ref={frameRef}
            onPointerMove={handleFramePointerMove}
            onPointerUp={() => setDraggingId(null)}
            onPointerLeave={() => setDraggingId(null)}
            className="relative w-full rotate-[-1.5deg] rounded-sm bg-surface p-3 pb-10 shadow-xl"
          >
            <div className="tape -top-3 left-6 rotate-[-8deg]" />
            <div className="tape -top-3 right-6 rotate-[6deg]" />

            <div
              className="relative w-full overflow-hidden rounded-sm"
              style={{ aspectRatio: `${FRAME_W - 24} / ${frameH}` }}
            >
              <canvas ref={baseCanvasRef} className="absolute inset-0 h-full w-full" />
              <canvas
                ref={drawCanvasRef}
                onPointerDown={handleDrawStart}
                onPointerMove={handleDrawMove}
                onPointerUp={handleDrawEnd}
                onPointerLeave={handleDrawEnd}
                className="absolute inset-0 h-full w-full"
                style={{ touchAction: "none", cursor: tab === "draw" ? "crosshair" : "default" }}
              />

              {placedStickers.map((s) => (
                // eslint-disable-next-line @next/next/no-img-element -- 사용자가 배치하는 임의의 스티커 이미지라 next/image 최적화 대상이 아님
                <img
                  key={s.id}
                  src={s.imageUrl}
                  alt="스티커"
                  onPointerDown={() => setDraggingId(s.id)}
                  className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-grab select-none active:cursor-grabbing"
                  style={{ left: `${s.xPct}%`, top: `${s.yPct}%`, touchAction: "none" }}
                />
              ))}
            </div>

            <p className="mt-2.5 text-center font-serif text-sm text-ink-soft">
              {concept?.name ?? "Dear, Photo"} 소포
            </p>

            <PostmarkStamp className="absolute -right-6 -top-6 h-20 w-20 rotate-[-8deg]" />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 border-t border-line bg-surface p-6 sm:p-8 lg:w-100 lg:border-l lg:border-t-0">
        {/* 우편 라벨 헤더 */}
        <div className="-mx-6 -mt-6 flex items-center gap-2 border-b border-dashed border-line bg-paper-soft px-4 py-2.5 sm:-mx-8 sm:-mt-8">
          <span className="text-sm">📮</span>
          <span className="text-xs font-bold text-ink-faint">
            {concept?.name ?? "컨셉"} 소포 꾸미는 중
          </span>
        </div>

        <div>
          <h1 className="text-lg font-extrabold">✉ 보낼 소포 꾸미기</h1>
          <p className="mt-1 text-sm text-ink-faint">
            스티커를 붙이거나 직접 그림을 그려 마음을 담아보세요
          </p>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => setTab("sticker")}
            className={`folder-tab cursor-pointer border px-4 py-2 text-sm font-bold ${
              tab === "sticker"
                ? "border-line border-b-surface bg-surface text-ink"
                : "border-transparent bg-transparent text-ink-faint hover:text-ink-soft"
            }`}
          >
            🏷️ 스티커
          </button>
          <button
            onClick={() => setTab("draw")}
            className={`folder-tab cursor-pointer border px-4 py-2 text-sm font-bold ${
              tab === "draw"
                ? "border-line border-b-surface bg-surface text-ink"
                : "border-transparent bg-transparent text-ink-faint hover:text-ink-soft"
            }`}
          >
            ✏️ 그림 그리기
          </button>
          <div className="flex-1 border-b border-line" />
        </div>

        {tab === "sticker" ? (
          <div className="-mt-2 flex flex-col gap-3">
            <span className="text-xs font-bold text-ink-faint">
              {concept?.name ?? "컨셉"} 스티커팩
            </span>
            <div className="grid grid-cols-4 gap-2.5">
              {stickers?.map((sticker) => (
                <button
                  key={sticker.id}
                  onClick={() => addSticker(sticker.imageUrl)}
                  className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-dashed border-line bg-paper p-2 transition-transform hover:-translate-y-0.5 hover:border-coral hover:bg-[#FBEAE6]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- 원격 스티커 썸네일 */}
                  <img src={sticker.imageUrl} alt={sticker.name} className="h-full w-full object-contain" />
                </button>
              ))}
              {stickers?.length === 0 && (
                <p className="col-span-4 text-xs text-ink-faint">
                  이 컨셉에는 아직 스티커가 없어요.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="-mt-2 flex flex-col gap-3 rounded-xl bg-paper p-3">
            <div className="grid grid-cols-4 gap-1.5">
              {BRUSH_TYPES.map(({ type, label, emoji }) => (
                <button
                  key={type}
                  onClick={() => setBrushType(type)}
                  className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-lg border py-2 text-[11px] font-bold transition-colors ${
                    brushType === type
                      ? "border-coral bg-[#FBEAE6] text-coral-dark"
                      : "border-line bg-surface text-ink-faint hover:text-ink-soft"
                  }`}
                >
                  <span className="text-base">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              <span className="shrink-0 text-xs text-ink-soft">색상</span>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                disabled={brushType === "eraser"}
                className="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-line bg-surface p-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="브러시 색상 선택"
              />
              <span className="ml-auto shrink-0 text-xs text-ink-soft">굵기</span>
              <input
                type="range"
                min={2}
                max={24}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full cursor-pointer accent-coral"
                aria-label="브러시 굵기"
              />
              <span
                className="shrink-0 rounded-full border border-line"
                style={{
                  width: Math.min(brushSize, 20),
                  height: Math.min(brushSize, 20),
                  backgroundColor: brushType === "eraser" ? "transparent" : brushColor,
                }}
                aria-hidden
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-ink-faint" htmlFor="diary-content">
            📮 오늘의 한 줄 (다이어리 우편함에 함께 남겨요)
          </label>
          <textarea
            id="diary-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘 첫 소포를 보냈다 :)"
            rows={3}
            className="w-full resize-none rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-coral focus:ring-3 focus:ring-coral/15"
          />
        </div>

        <div className="mt-auto flex flex-col gap-2.5">
          <Button onClick={handleDownload} disabled={isDownloading} className="w-full">
            ⬇ 소포 다운로드
          </Button>
          <Button
            onClick={handleSaveToDiary}
            variant="ghost"
            disabled={isSaving}
            className="w-full"
          >
            {isAuthenticated ? "📬 우편함(다이어리)으로 보내기" : "🔒 로그인하고 우편함으로 보내기"}
          </Button>
          <p className="text-center text-xs text-[#B3AB9C]">
            비로그인 상태에서는 다운로드만 가능해요
          </p>
        </div>
      </div>
    </main>
  );
}
