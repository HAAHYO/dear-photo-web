"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getConceptDetail } from "@/shared/api/concepts";
import { CAPTURE_STORAGE_KEY } from "@/shared/config/storageKeys";
import {
  SHOT_COUNTS,
  DEFAULT_LAYOUT_ID,
  getPhotoLayout,
  layoutsForShotCount,
  slotAspectRatio,
} from "@/shared/config/photoLayouts";
import { PostmarkStamp } from "@/shared/ui/PostmarkStamp";

const COUNTDOWN_SECONDS = 3;
const PRINT_ANIMATION_MS = 1500;

const FILTERS = [
  { id: "none", label: "원본", css: "none" },
  { id: "bw", label: "흑백", css: "grayscale(1) contrast(1.05)" },
  { id: "sepia", label: "세피아", css: "sepia(0.55) contrast(1.05)" },
  { id: "warm", label: "따뜻하게", css: "saturate(1.35) brightness(1.05) sepia(0.12)" },
  { id: "cool", label: "시원하게", css: "saturate(1.1) hue-rotate(-8deg) brightness(1.03)" },
  { id: "vivid", label: "선명하게", css: "contrast(1.2) saturate(1.3)" },
  { id: "vintage", label: "빈티지", css: "sepia(0.4) contrast(0.9) brightness(1.1) saturate(0.8)" },
  { id: "noir", label: "느와르", css: "grayscale(1) contrast(1.4) brightness(0.9)" },
  { id: "dreamy", label: "몽환적", css: "brightness(1.15) saturate(1.4) contrast(0.95) blur(0.4px)" },
  { id: "pastel", label: "파스텔", css: "saturate(0.7) brightness(1.12) contrast(0.9)" },
] as const;

export default function CapturePage() {
  const params = useParams<{ conceptId: string }>();
  const conceptId = Number(params.conceptId);
  const router = useRouter();

  const { data: concept, isLoading, isError } = useQuery({
    queryKey: ["concept", conceptId],
    queryFn: () => getConceptDetail(conceptId),
    enabled: Number.isFinite(conceptId),
    retry: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [layoutId, setLayoutId] = useState(DEFAULT_LAYOUT_ID);
  const layout = getPhotoLayout(layoutId);
  // 같은 컷 수 안에서 세로/가로처럼 방향이 여럿이면 방향 선택 버튼을 추가로 보여준다
  const orientationOptions = layoutsForShotCount(layout.shots);
  // 카메라 미리보기를 실제 인화 슬롯과 같은 비율로 맞춰서, 찍을 때 본 구도가
  // 결과물에서 엉뚱하게 잘리지 않게 한다
  const previewAspect = slotAspectRatio(layout);
  // 촬영본 썸네일도 같은 비율로 — 레이아웃이 바뀌면 썸네일 모양도 같이 바뀐다
  const thumbW = 84;
  const thumbH = Math.round(thumbW / previewAspect);
  // 사이드 패널은 폭이 좁아서(w-48), 3컷 가로처럼 한 줄에 여러 장을 놓는 레이아웃은
  // 줄바꿈되지 않게 그 폭에 맞춰 썸네일을 더 작게 줄인다
  const SIDEBAR_CONTENT_W = 190;
  const SIDEBAR_GAP = 10;
  const sidebarThumbW = Math.min(
    thumbW,
    Math.floor((SIDEBAR_CONTENT_W - SIDEBAR_GAP * (layout.cols - 1)) / layout.cols)
  );
  const sidebarThumbH = Math.round(sidebarThumbW / previewAspect);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>(FILTERS[0]);
  const [shots, setShots] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  // 다 찍었으면 곧바로 넘어가지 않고, 프린터에서 인화지가 나오는 연출을 먼저 보여준다
  const isPrinting = shots.length === layout.shots && !!concept;

  useEffect(() => {
    let mounted = true;
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (!mounted) {
          // 스트림을 받기 전에 이미 언마운트됐다면 곧바로 꺼서 카메라가 계속 켜진 채로 남지 않게 한다
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = media;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        if (mounted) setCameraError("카메라를 사용할 수 없어요. 권한을 확인해주세요.");
      }
    }

    startCamera();
    return () => {
      mounted = false;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const takeShot = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 셀피 화면과 동일하게 좌우 반전해서 저장하고, 고른 필터도 그대로 구워 넣는다
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.filter = filter.css;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.92);
  }, [filter]);

  const runShotSequence = useCallback(async () => {
    if (isBusy || !concept) return;
    setIsBusy(true);

    for (let i = 0; i < COUNTDOWN_SECONDS; i++) {
      setCountdown(COUNTDOWN_SECONDS - i);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    setCountdown(null);

    const shot = takeShot();
    if (shot) {
      setShots((prev) => [...prev, shot]);
    } else {
      toast.error("촬영에 실패했어요. 다시 시도해주세요.");
    }
    setIsBusy(false);
  }, [isBusy, concept, takeShot]);

  useEffect(() => {
    if (!isPrinting || !concept) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem(
        CAPTURE_STORAGE_KEY,
        JSON.stringify({ conceptId: concept.id, shots, layoutId })
      );
      router.push(`/booth/${concept.id}/edit`);
    }, PRINT_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [isPrinting, concept, shots, layoutId, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink text-white">
        <p className="text-sm text-[#C9C4BA]">컨셉을 불러오는 중이에요…</p>
      </main>
    );
  }

  if (isError || !concept) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink text-white">
        <p className="text-lg font-bold">아직 준비되지 않은 컨셉이에요.</p>
        <Link href="/" className="text-sm font-bold text-lemon">
          컨셉 선택으로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-ink px-0 pt-8 pb-10 text-white">
      {/* 우편 컨셉 포인트: 은은한 도트 텍스처 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1.4px, transparent 1.4px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 mb-2 flex w-full max-w-4xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-[#C9C4BA] hover:text-white"
        >
          <span>←</span>
          <span>컨셉 선택으로</span>
        </Link>
        <span className="rounded-full bg-[#E85D4E]/20 px-3 py-1.5 text-xs font-bold text-[#F09184]">
          {concept.name} 컨셉
        </span>
      </div>

      {concept.bgmUrl && (
        <audio src={concept.bgmUrl} autoPlay loop className="hidden" />
      )}

      {/* 모바일: 컷 수 → (필요하면) 방향 선택을 카메라 위에 가로로 배치 (넓은 화면에선 사이드 패널로 옮겨서 숨김) */}
      {shots.length === 0 && (
        <div className="relative z-10 mt-3 flex flex-col items-center gap-1.5 lg:hidden">
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 p-1.5">
            {SHOT_COUNTS.map((count) => (
              <button
                key={count}
                onClick={() => setLayoutId(layoutsForShotCount(count)[0].id)}
                className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  layout.shots === count ? "bg-coral text-white" : "text-[#C9C4BA] hover:text-white"
                }`}
              >
                {count}컷
              </button>
            ))}
          </div>
          {orientationOptions.length > 1 && (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 p-1.5">
              {orientationOptions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setLayoutId(v.id)}
                  className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    layoutId === v.id ? "bg-coral text-white" : "text-[#C9C4BA] hover:text-white"
                  }`}
                >
                  {v.orientationLabel}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 넓은 화면: 카메라 좌우 여백을 활용해 레이아웃/필터 선택을 사이드 패널로 배치 */}
      <div className="relative z-10 flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-6 px-4 lg:flex-row lg:items-center lg:gap-10">
        <div className="hidden w-44 shrink-0 flex-col gap-2 lg:flex">
          <span className="text-xs font-bold tracking-wide text-[#9A938A]">컷 수</span>
          <div className="grid grid-cols-2 gap-2">
            {SHOT_COUNTS.map((count) => (
              <button
                key={count}
                onClick={() => setLayoutId(layoutsForShotCount(count)[0].id)}
                disabled={shots.length > 0}
                className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  layout.shots === count
                    ? "border-coral bg-coral/15 text-white"
                    : "border-white/15 text-[#C9C4BA] hover:text-white"
                }`}
              >
                {count}컷
              </button>
            ))}
          </div>

          {orientationOptions.length > 1 && (
            <>
              <span className="mt-2 text-xs font-bold tracking-wide text-[#9A938A]">방향</span>
              <div className="flex gap-2">
                {orientationOptions.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setLayoutId(v.id)}
                    disabled={shots.length > 0}
                    className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      layoutId === v.id
                        ? "border-coral bg-coral/15 text-white"
                        : "border-white/15 text-[#C9C4BA] hover:text-white"
                    }`}
                  >
                    {v.orientationLabel}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col items-center">
          {/* 항공우편 테두리로 감싼 카메라 프레임 (소포 컨셉 포인트) */}
          <div className="relative max-w-[92vw]">
            <div className="airmail-frame shadow-2xl">
              <div
                className="relative overflow-hidden rounded-sm bg-[#3A342E]"
                style={{
                  width: `min(92vw, 480px, calc(70vh * ${previewAspect}))`,
                  aspectRatio: previewAspect,
                }}
              >
                {cameraError ? (
                  <div className="flex h-full items-center justify-center px-8 text-center text-sm text-[#E3DFD5]">
                    {cameraError}
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full scale-x-[-1] object-cover"
                    style={{ filter: filter.css }}
                  />
                )}

                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-lemon bg-black/40 text-5xl font-extrabold">
                      {countdown}
                    </div>
                  </div>
                )}

                {[
                  "top-4 left-4 border-l-4 border-t-4 rounded-tl-md",
                  "top-4 right-4 border-r-4 border-t-4 rounded-tr-md",
                  "bottom-4 left-4 border-l-4 border-b-4 rounded-bl-md",
                  "bottom-4 right-4 border-r-4 border-b-4 rounded-br-md",
                ].map((cls) => (
                  <div key={cls} className={`absolute h-9 w-9 border-lemon ${cls}`} />
                ))}
              </div>
            </div>

            <div className="tape -top-3 left-10 rotate-[-8deg]" />
            <div className="tape -top-3 right-10 rotate-[6deg]" />
            <PostmarkStamp className="absolute -right-6 -top-6 h-20 w-20 rotate-6 text-white" />
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* 필터 선택: 화면 크기와 무관하게 카메라 바로 아래 고정. 5열 그리드로 짝수 줄을 맞춰서
              마지막 한 개만 혼자 다음 줄에 남는 것을 방지한다 */}
          <div className="mt-5 grid grid-cols-5 justify-items-stretch gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                  filter.id === f.id
                    ? "border-lemon bg-lemon/20 text-lemon"
                    : "border-white/15 text-[#C9C4BA] hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 모바일: 촬영본 슬롯 (넓은 화면에선 오른쪽 사이드 패널로 옮겨서 숨김) */}
          <div
            className="mt-5 grid justify-center gap-3.5 lg:hidden"
            style={{ gridTemplateColumns: `repeat(${layout.cols}, ${thumbW}px)` }}
          >
            {Array.from({ length: layout.shots }).map((_, i) => (
              <div
                key={i}
                className={`flex items-center justify-center rounded-lg text-xs ${
                  shots[i]
                    ? "border-2 border-lemon bg-cover bg-center"
                    : "border-2 border-dashed border-[#5C564E] bg-[#3A342E] text-[#7A736A]"
                }`}
                style={{
                  width: thumbW,
                  height: thumbH,
                  ...(shots[i] ? { backgroundImage: `url(${shots[i]})` } : undefined),
                }}
              >
                {!shots[i] && i + 1}
              </div>
            ))}
          </div>

          <button
            onClick={runShotSequence}
            disabled={isBusy || !!cameraError || shots.length >= layout.shots}
            className="mt-7 h-19 w-19 cursor-pointer rounded-full border-4 border-white bg-coral disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="촬영하기"
          />
          <p className="mt-3 text-sm text-[#9A938A]">
            {Math.min(shots.length + 1, layout.shots)} / {layout.shots}컷 촬영 중
          </p>
        </div>

        {/* 넓은 화면: 촬영본 슬롯을 오른쪽 사이드 여백에 배치 (카드 크기는 모바일 버전과 동일하게 유지) */}
        <div className="hidden w-48 shrink-0 flex-col items-center gap-2 lg:flex">
          <span className="self-start text-xs font-bold tracking-wide text-[#9A938A]">촬영본</span>
          <div
            className="grid justify-center gap-2.5"
            style={{ gridTemplateColumns: `repeat(${layout.cols}, ${sidebarThumbW}px)` }}
          >
            {Array.from({ length: layout.shots }).map((_, i) => (
              <div
                key={i}
                className={`flex items-center justify-center rounded-lg text-xs ${
                  shots[i]
                    ? "border-2 border-lemon bg-cover bg-center"
                    : "border-2 border-dashed border-[#5C564E] bg-[#3A342E] text-[#7A736A]"
                }`}
                style={{
                  width: sidebarThumbW,
                  height: sidebarThumbH,
                  ...(shots[i] ? { backgroundImage: `url(${shots[i]})` } : undefined),
                }}
              >
                {!shots[i] && i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 촬영 완료: 프린터 슬롯에서 인화지가 나오는 연출 */}
      {isPrinting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-start bg-black/75 pt-20">
          <div className="relative flex flex-col items-center">
            <div className="z-10 h-6 w-56 rounded-full bg-[#100f16] shadow-[0_6px_18px_rgba(0,0,0,0.6)]" />
            <div className="w-52 overflow-hidden rounded-b-md" style={{ maxHeight: "68vh" }}>
              <div className="print-strip flex flex-col gap-1.5 bg-white p-3 pt-4 shadow-2xl">
                {shots.map((shot, i) => (
                  // eslint-disable-next-line @next/next/no-img-element -- 캔버스로 캡처한 dataURL이라 next/image 대상이 아님
                  <img
                    key={i}
                    src={shot}
                    alt=""
                    className="h-28 w-full rounded-sm object-cover"
                  />
                ))}
                <p className="mt-1 text-center font-serif text-xs text-ink-soft">
                  DEAR, PHOTO
                </p>
              </div>
            </div>
          </div>
          <p className="mt-6 animate-pulse text-sm text-white/70">소포를 인화하는 중...</p>
        </div>
      )}
    </main>
  );
}
