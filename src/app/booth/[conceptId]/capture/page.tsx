"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getConceptDetail } from "@/shared/api/concepts";
import { CAPTURE_STORAGE_KEY } from "@/shared/config/storageKeys";

const SHOT_COUNT = 4;
const COUNTDOWN_SECONDS = 3;

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

  const [shots, setShots] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

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

    // 셀피 화면과 동일하게 좌우 반전해서 저장한다
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.92);
  }, []);

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
    if (shots.length === SHOT_COUNT && concept) {
      sessionStorage.setItem(
        CAPTURE_STORAGE_KEY,
        JSON.stringify({ conceptId: concept.id, shots })
      );
      router.push(`/booth/${concept.id}/edit`);
    }
  }, [shots, concept, router]);

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
    <main className="flex min-h-screen flex-col items-center bg-ink px-0 pt-8 pb-10 text-white">
      <div className="mb-2 flex w-full max-w-4xl items-center justify-between px-4">
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

      <div className="relative mt-4 h-130 w-190 max-w-[92vw] overflow-hidden rounded-2xl bg-[#3A342E]">
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

      <canvas ref={canvasRef} className="hidden" />

      <div className="mt-6 flex gap-3.5">
        {Array.from({ length: SHOT_COUNT }).map((_, i) => (
          <div
            key={i}
            className={`flex h-30 w-24 items-center justify-center rounded-lg text-xs ${
              shots[i]
                ? "border-2 border-lemon bg-cover bg-center"
                : "border-2 border-dashed border-[#5C564E] bg-[#3A342E] text-[#7A736A]"
            }`}
            style={shots[i] ? { backgroundImage: `url(${shots[i]})` } : undefined}
          >
            {!shots[i] && i + 1}
          </div>
        ))}
      </div>

      <button
        onClick={runShotSequence}
        disabled={isBusy || !!cameraError || shots.length >= SHOT_COUNT}
        className="mt-7 h-19 w-19 cursor-pointer rounded-full border-4 border-white bg-coral disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="촬영하기"
      />
      <p className="mt-3 text-sm text-[#9A938A]">
        {Math.min(shots.length + 1, SHOT_COUNT)} / {SHOT_COUNT}컷 촬영 중
      </p>
    </main>
  );
}
