import Link from "next/link";
import Header from "@/widgets/Header";
import Footer from "@/widgets/Footer";
import { Button } from "@/shared/ui/Button";
import { PostmarkStamp } from "@/shared/ui/PostmarkStamp";

const STEPS = [
  {
    emoji: "📦",
    title: "컨셉 고르기",
    desc: "오늘 마음에 드는 촬영 컨셉과 배경을 골라요. 로그인 없이도 바로 시작할 수 있어요.",
  },
  {
    emoji: "📸",
    title: "네컷 촬영",
    desc: "카운트다운에 맞춰 네 장의 사진을 남겨요. 마음에 안 들면 다시 촬영할 수 있어요.",
  },
  {
    emoji: "✏️",
    title: "스티커 & 편지",
    desc: "스티커를 붙이고 직접 그림을 그려서 사진을 꾸미고, 오늘의 한 줄을 편지처럼 적어요.",
  },
  {
    emoji: "📬",
    title: "우편함 배달",
    desc: "완성한 사진은 바로 다운로드하거나, 로그인해서 다이어리 우편함에 소포처럼 저장해요.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />

      <section className="px-5 py-8 sm:px-8 sm:py-11 lg:px-14">
        <div className="airmail-frame shadow-xl">
          <div className="relative overflow-hidden bg-surface px-6 py-10 text-center sm:px-10 sm:py-12">
            <PostmarkStamp className="absolute -right-4 -top-4 hidden h-24 w-24 rotate-6 sm:block" />
            <span className="mb-3 inline-block rounded-full bg-pink px-3 py-1.5 text-xs font-bold text-coral-dark">
              📮 Dear, Photo가 뭐예요?
            </span>
            <h1 className="mx-auto max-w-lg text-2xl leading-snug font-extrabold sm:text-3xl">
              네컷 사진을 찍고 꾸며서,
              <br />
              소포처럼 우편함에 배달하는 포토부스예요
            </h1>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-8 px-5 pb-14 sm:px-8 lg:px-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative h-full">
              <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-2xl border border-line bg-paper-soft" />
              <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-2xl border border-line bg-surface" />
              <div className="relative flex h-full flex-col gap-2.5 rounded-2xl border border-line bg-surface p-6 shadow-lg">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-pink text-xl">
                  {step.emoji}
                </span>
                <span className="text-xs font-bold text-coral-dark">STEP {i + 1}</span>
                <h2 className="font-extrabold">{step.title}</h2>
                <p className="text-sm leading-relaxed text-ink-faint">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-ink-faint">이제 첫 소포를 보내볼까요?</p>
          <Link href="/">
            <Button>📮 포토부스 바로가기</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
