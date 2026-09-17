"use client";

/**
 * 🧪 스파이크 프로토타입 — 모션(손 제스처) 인식으로 자동 촬영이 실용적인지 검증
 *
 * 실제 촬영 화면(booth/[conceptId]/capture)과는 완전히 분리된 독립 페이지다.
 * 여기서 실용적이라고 판단되면 그때 본체 촬영 화면에 통합하는 걸 논의한다.
 *
 * 라이브러리: @mediapipe/tasks-vision의 GestureRecognizer
 * - "Victory"(브이 사인)는 내장 제스처 카테고리라 직접 좌표 기반 판별 로직 없이
 *   바로 confidence score를 받을 수 있다. (손 흔들기는 내장 제스처가 아니라서
 *   이번 스파이크 범위에서 제외 — 실용성 확인되면 별도 휴리스틱으로 2차 스파이크)
 *
 * 검증 항목 (요청서 기준):
 * 1) 모바일에서 프레임 처리 속도 — 추론 latency(ms), 분석 FPS를 실측
 * 2) 배터리/발열 부담 — 추론 주기(쓰로틀)를 조절 가능하게 해서 부하-정확도 트레이드오프 확인
 * 3) 오작동 빈도 — 일정 시간 연속으로 같은 제스처가 유지될 때만 트리거 + 촬영 후 쿨다운
 * 4) 초기 로딩 — 모델/WASM 로딩 시간을 실측해서 표시
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { GestureRecognizer as GestureRecognizerType } from "@mediapipe/tasks-vision";
import { silenceMediapipeConsoleNoise } from "@/shared/lib/silenceMediapipeLogs";

// 설치된 @mediapipe/tasks-vision 버전과 반드시 맞춰야 한다 (package.json 참고)
const TASKS_VISION_VERSION = "1.0.1";
const WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
// 구글이 제공하는 공식 사전학습 제스처 인식 모델 (float16, 경량 버전)
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";

const TARGET_GESTURE = "Victory";
const COUNTDOWN_SECONDS = 2;
const COOLDOWN_MS = 2500;
const LATENCY_SAMPLE_SIZE = 30;

type Delegate = "GPU" | "CPU";
type LoadState = "idle" | "loading-camera" | "loading-model" | "ready" | "error";

type LogEntry = { time: string; text: string };

function nowLabel() {
  return new Date().toLocaleTimeString("ko-KR", { hour12: false });
}

export default function MotionCaptureSpikePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognizerRef = useRef<GestureRecognizerType | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastInferenceAtRef = useRef(0);
  const holdStartRef = useRef<number | null>(null);
  const cooldownUntilRef = useRef(0);
  const isCapturingRef = useRef(false);
  const latencySamplesRef = useRef<number[]>([]);
  const lastTimestampRef = useRef(0);
  const loggedErrorRef = useRef(false);

  const [delegate, setDelegate] = useState<Delegate>("GPU");
  const [inferenceIntervalMs, setInferenceIntervalMs] = useState(150);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.65);
  const [holdDurationMs, setHoldDurationMs] = useState(700);

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [modelLoadMs, setModelLoadMs] = useState<number | null>(null);
  const [avgLatencyMs, setAvgLatencyMs] = useState<number | null>(null);
  const [analysisHz, setAnalysisHz] = useState<number | null>(null);

  const [currentGesture, setCurrentGesture] = useState<{ name: string; score: number } | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const log = useCallback((text: string) => {
    setLogs((prev) => [{ time: nowLabel(), text }, ...prev].slice(0, 40));
  }, []);

  const takeSnapshot = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  }, []);

  const triggerCapture = useCallback(() => {
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;
    log(`✋ ${TARGET_GESTURE} 유지 감지 → 카운트다운 시작`);

    let remaining = COUNTDOWN_SECONDS;
    setCountdown(remaining);
    const tick = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(tick);
        setCountdown(null);
        const photo = takeSnapshot();
        if (photo) {
          setCapturedPhoto(photo);
          log("📸 자동 촬영 완료");
        } else {
          log("⚠️ 촬영 실패 (캔버스/비디오 준비 안 됨)");
        }
        cooldownUntilRef.current = performance.now() + COOLDOWN_MS;
        setIsCoolingDown(true);
        setTimeout(() => {
          setIsCoolingDown(false);
          isCapturingRef.current = false;
          holdStartRef.current = null;
          setHoldProgress(0);
          log("쿨다운 종료 — 다시 인식 시작");
        }, COOLDOWN_MS);
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  }, [log, takeSnapshot]);

  const loadRecognizer = useCallback(
    async (nextDelegate: Delegate) => {
      setLoadState("loading-model");
      loggedErrorRef.current = false;
      lastTimestampRef.current = 0;
      const started = performance.now();
      try {
        const { GestureRecognizer, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const filesetResolver = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
        const recognizer = await GestureRecognizer.createFromOptions(filesetResolver, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: nextDelegate },
          runningMode: "VIDEO",
          numHands: 1,
        });
        recognizerRef.current?.close();
        recognizerRef.current = recognizer;
        const elapsed = Math.round(performance.now() - started);
        setModelLoadMs(elapsed);
        setLoadState("ready");
        log(`✅ 모델 로딩 완료 (${nextDelegate} delegate, ${elapsed}ms)`);
      } catch (error) {
        setLoadState("error");
        log(`❌ 모델 로딩 실패: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    [log]
  );

  // MediaPipe/TFLite WASM이 정보성 로그를 console.error로 찍는 바람에 Next 개발 모드의
  // 에러 오버레이가 실제 에러 없이도 계속 뜨는 걸 막는다 (프로덕션 빌드엔 영향 없음)
  useEffect(() => {
    const restore = silenceMediapipeConsoleNoise();
    return restore;
  }, []);

  // 카메라 시작
  useEffect(() => {
    let mounted = true;
    let stream: MediaStream | null = null;

    async function startCamera() {
      setLoadState("loading-camera");
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (!mounted) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = media;
        if (videoRef.current) videoRef.current.srcObject = stream;
        log("🎥 카메라 시작됨");
      } catch (error) {
        setLoadState("error");
        log(`❌ 카메라 권한 실패: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    startCamera();
    return () => {
      mounted = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시 한 번만
  }, []);

  // 모델 로딩 (delegate가 바뀌면 다시 로딩해서 GPU/CPU 비교 측정)
  useEffect(() => {
    // loadRecognizer 내부의 setLoadState가 await 이전에 동기 실행되는 걸 피하려고
    // 마이크로태스크로 한 틱 미룬다
    queueMicrotask(() => {
      loadRecognizer(delegate);
    });
    return () => {
      recognizerRef.current?.close();
      recognizerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- delegate 변경 시에만 재로딩
  }, [delegate]);

  // 추론 루프: 화면 렌더링(rAF)은 매 프레임 돌지만, 실제 추론은 inferenceIntervalMs
  // 간격으로만 쓰로틀링해서 CPU/배터리 부담을 조절할 수 있게 한다
  useEffect(() => {
    if (loadState !== "ready") return;

    function loop() {
      rafRef.current = requestAnimationFrame(loop);

      const video = videoRef.current;
      const recognizer = recognizerRef.current;
      if (!video || !recognizer || video.videoWidth === 0) return;
      if (isCapturingRef.current) return;

      const now = performance.now();
      if (now - lastInferenceAtRef.current < inferenceIntervalMs) return;
      lastInferenceAtRef.current = now;

      // recognizeForVideo는 정수 ms + 이전 호출보다 반드시 큰 타임스탬프를 요구한다.
      // 그냥 performance.now()(소수점 있는 값)를 넘기면 내부에서 매번 예외를 던져서
      // 아무 것도 인식되지 않는데, catch에서 조용히 무시하면 그 사실조차 안 보인다.
      let ts = Math.round(now);
      if (ts <= lastTimestampRef.current) ts = lastTimestampRef.current + 1;
      lastTimestampRef.current = ts;

      const t0 = performance.now();
      let result;
      try {
        result = recognizer.recognizeForVideo(video, ts);
      } catch (error) {
        if (!loggedErrorRef.current) {
          loggedErrorRef.current = true;
          log(`❌ recognizeForVideo 실패: ${error instanceof Error ? error.message : String(error)}`);
        }
        return;
      }
      const latency = performance.now() - t0;

      const samples = latencySamplesRef.current;
      samples.push(latency);
      if (samples.length > LATENCY_SAMPLE_SIZE) samples.shift();
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      setAvgLatencyMs(Math.round(avg * 10) / 10);
      setAnalysisHz(Math.round((1000 / Math.max(avg, 1)) * 10) / 10);

      const topGesture = result.gestures[0]?.[0];
      if (topGesture && topGesture.categoryName !== "None") {
        setCurrentGesture({ name: topGesture.categoryName, score: topGesture.score });
      } else {
        setCurrentGesture(null);
      }

      const isTarget =
        topGesture?.categoryName === TARGET_GESTURE && topGesture.score >= confidenceThreshold;

      if (now < cooldownUntilRef.current) {
        setHoldProgress(0);
        return;
      }

      if (isTarget) {
        if (holdStartRef.current === null) {
          holdStartRef.current = now;
          log(`✌️ ${TARGET_GESTURE} 감지 시작 (${(topGesture!.score * 100).toFixed(0)}%) — 유지해주세요`);
        }
        const held = now - holdStartRef.current;
        const progress = Math.min(1, held / holdDurationMs);
        setHoldProgress(progress);
        if (progress >= 1) {
          triggerCapture();
        }
      } else {
        holdStartRef.current = null;
        setHoldProgress(0);
      }
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loadState, inferenceIntervalMs, confidenceThreshold, holdDurationMs, triggerCapture, log]);

  return (
    <main className="min-h-screen bg-ink px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-xl border border-lemon/40 bg-lemon/10 p-4">
          <p className="font-bold text-lemon">🧪 스파이크 프로토타입 — 본체 촬영 화면과 무관</p>
          <p className="mt-1 text-sm text-[#C9C4BA]">
            브이 사인(✌️)을 {(holdDurationMs / 1000).toFixed(1)}초 이상 유지하면 자동으로
            카운트다운 후 촬영돼요. 실용성 검증용이며, 실제 서비스에 반영된 기능이 아닙니다.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* 카메라 + 오버레이 */}
          <div>
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#3A342E]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full scale-x-[-1] object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {currentGesture && (
                <div className="absolute top-3 left-3 rounded-full bg-black/50 px-3 py-1.5 text-xs font-bold">
                  {currentGesture.name} · {(currentGesture.score * 100).toFixed(0)}%
                </div>
              )}

              {holdProgress > 0 && countdown === null && (
                <div className="absolute inset-x-4 bottom-4 h-2 overflow-hidden rounded-full bg-black/40">
                  <div
                    className="h-full rounded-full bg-lemon transition-[width] duration-100"
                    style={{ width: `${holdProgress * 100}%` }}
                  />
                </div>
              )}

              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-lemon bg-black/40 text-4xl font-extrabold">
                    {countdown}
                  </div>
                </div>
              )}

              {isCoolingDown && (
                <div className="absolute top-3 right-3 rounded-full bg-black/50 px-3 py-1.5 text-xs font-bold text-[#C9C4BA]">
                  쿨다운 중…
                </div>
              )}

              {loadState !== "ready" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm">
                  {loadState === "loading-camera" && "카메라 권한 요청 중…"}
                  {loadState === "loading-model" && "제스처 인식 모델 로딩 중… (첫 로딩은 느릴 수 있어요)"}
                  {loadState === "error" && "오류 발생 — 아래 로그 확인"}
                  {loadState === "idle" && "준비 중…"}
                </div>
              )}
            </div>

            {capturedPhoto && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-bold text-[#C9C4BA]">마지막 촬영본</p>
                {/* eslint-disable-next-line @next/next/no-img-element -- 캔버스로 캡처한 dataURL, next/image 대상 아님 */}
                <img src={capturedPhoto} alt="자동 촬영된 사진" className="w-56 rounded-xl border-2 border-lemon" />
              </div>
            )}
          </div>

          {/* 측정치 + 설정 + 로그 */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-white/15 bg-white/5 p-4">
              <p className="mb-2 text-xs font-bold tracking-wide text-[#9A938A]">측정치</p>
              <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
                <dt className="text-[#9A938A]">모델 로딩 시간</dt>
                <dd className="text-right font-bold">{modelLoadMs !== null ? `${modelLoadMs}ms` : "-"}</dd>
                <dt className="text-[#9A938A]">추론 지연(평균)</dt>
                <dd className="text-right font-bold">{avgLatencyMs !== null ? `${avgLatencyMs}ms` : "-"}</dd>
                <dt className="text-[#9A938A]">실질 분석 속도</dt>
                <dd className="text-right font-bold">{analysisHz !== null ? `${analysisHz} Hz` : "-"}</dd>
                <dt className="text-[#9A938A]">Delegate</dt>
                <dd className="text-right font-bold">{delegate}</dd>
              </dl>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/5 p-4">
              <p className="mb-3 text-xs font-bold tracking-wide text-[#9A938A]">설정 (실용성 비교용)</p>

              <label className="mb-3 block text-xs">
                Delegate (GPU/CPU 성능 비교)
                <div className="mt-1.5 flex gap-2">
                  {(["GPU", "CPU"] as Delegate[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDelegate(d)}
                      disabled={loadState === "loading-model"}
                      className={`flex-1 cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${
                        delegate === d ? "border-lemon bg-lemon/20 text-lemon" : "border-white/15 text-[#C9C4BA]"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </label>

              <label className="mb-3 block text-xs">
                추론 주기(쓰로틀): {inferenceIntervalMs}ms (~{Math.round(1000 / inferenceIntervalMs)}Hz 목표)
                <input
                  type="range"
                  min={50}
                  max={500}
                  step={10}
                  value={inferenceIntervalMs}
                  onChange={(e) => setInferenceIntervalMs(Number(e.target.value))}
                  className="mt-1.5 w-full cursor-pointer accent-lemon"
                />
              </label>

              <label className="mb-3 block text-xs">
                최소 확신도: {(confidenceThreshold * 100).toFixed(0)}%
                <input
                  type="range"
                  min={0.4}
                  max={0.95}
                  step={0.05}
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                  className="mt-1.5 w-full cursor-pointer accent-lemon"
                />
              </label>

              <label className="block text-xs">
                유지 시간: {(holdDurationMs / 1000).toFixed(1)}초
                <input
                  type="range"
                  min={300}
                  max={2000}
                  step={100}
                  value={holdDurationMs}
                  onChange={(e) => setHoldDurationMs(Number(e.target.value))}
                  className="mt-1.5 w-full cursor-pointer accent-lemon"
                />
              </label>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/5 p-4">
              <p className="mb-2 text-xs font-bold tracking-wide text-[#9A938A]">로그</p>
              <div className="max-h-64 overflow-y-auto font-mono text-[11px] leading-relaxed text-[#C9C4BA]">
                {logs.length === 0 && <p className="text-[#7A736A]">아직 로그 없음</p>}
                {logs.map((entry, i) => (
                  <p key={i}>
                    <span className="text-[#7A736A]">{entry.time}</span> {entry.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
