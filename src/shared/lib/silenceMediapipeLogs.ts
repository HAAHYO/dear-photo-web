// MediaPipe/TensorFlow Lite WASM 내부는 정보성 로그(델리게이트 초기화, 그래프 시작 등)를
// console.error로 찍는다. 실제 에러가 아닌데도 Next.js 개발 모드는 console.error 호출을
// 전부 전체 화면 에러 오버레이로 띄워버려서, 인식 자체는 멀쩡한데 화면이 계속 가려진다.
// (프로덕션 빌드에는 이 오버레이가 없어서 영향 없음 — 개발 경험만 해치는 노이즈다.)
//
// 여기서 걸러내는 패턴만 삼키고 그 외 진짜 에러는 그대로 통과시킨다.
const MEDIAPIPE_NOISE_PATTERN = /\.cc:\d+\]|TensorFlow Lite|Graph successfully started running/;

/** 반환된 함수를 호출하면 console.error를 원래대로 되돌린다. */
export function silenceMediapipeConsoleNoise(): () => void {
  const original = console.error;
  console.error = (...args: unknown[]) => {
    const text = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ");
    if (MEDIAPIPE_NOISE_PATTERN.test(text)) return;
    original(...args);
  };
  return () => {
    console.error = original;
  };
}
