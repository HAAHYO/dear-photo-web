"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Header from "@/widgets/Header";
import Footer from "@/widgets/Footer";
import { Button } from "@/shared/ui/Button";
import { PostmarkStamp } from "@/shared/ui/PostmarkStamp";
import { getConcepts } from "@/shared/api/concepts";

const STEPS = [
  {
    emoji: "📦",
    title: "컨셉 고르기",
    desc: "오늘 마음에 드는 촬영 컨셉과 배경을 골라요.",
  },
  {
    emoji: "📸",
    title: "네컷 촬영",
    desc: "카운트다운에 맞춰 네 장의 사진을 남겨요.",
  },
  {
    emoji: "✏️",
    title: "스티커 & 편지",
    desc: "스티커를 붙이고 그림을 그려 오늘의 한 줄을 적어요.",
  },
  {
    emoji: "📬",
    title: "우편함 배달",
    desc: "다운로드하거나 로그인해서 다이어리 우편함에 저장해요.",
  },
];

export default function Home() {
  const { data: concepts, isLoading, isError } = useQuery({
    queryKey: ["concepts"],
    queryFn: getConcepts,
    retry: false,
  });

  const placeholderCount = Math.max(0, 5 - (concepts?.length ?? 0));

  const CARD_TILTS = ["-rotate-1", "rotate-1", "-rotate-2", "rotate-2", "rotate-1"];

  return (
    <main className="mail-dot-bg flex min-h-screen flex-col">
      <Header />

      <section className="px-5 py-6 sm:px-8 sm:py-10 lg:px-14">
        {/* 엽서(postcard) 그 자체인 히어로 */}
        <div className="airmail-frame shadow-xl">
          <div className="relative overflow-hidden bg-surface px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            <span className="mb-4 inline-block rounded-full bg-pink px-3 py-1.5 text-xs font-bold text-coral-dark">
              📮 로그인 없이 바로 촬영 가능
            </span>
            <h1 className="max-w-xl text-2xl leading-snug font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              오늘의 컨셉을 골라
              <br />
              네컷 소포를 보내보세요
            </h1>
            <p className="mt-3.5 max-w-xl leading-relaxed text-ink-soft">
              컨셉을 골라 촬영하고, 스티커와 그림을 더해 완성한 뒤
              다운로드하거나 로그인하고 다이어리 우편함에 저장하세요.
            </p>

            {/* 우표 + 소인: 엽서 오른쪽 위 모서리 (좁은 화면에선 본문과 겹쳐 숨김) */}
            <div className="absolute right-12 top-10 hidden h-20 w-16 rotate-2 border border-dashed border-line lg:block" />
            <PostmarkStamp className="absolute right-9 top-16 hidden h-24 w-24 -rotate-6 lg:block" />

            {/* 받는 사람 줄: 엽서 오른쪽 아래 */}
            <div className="absolute bottom-12 right-16 hidden items-end gap-3 text-ink-faint/70 lg:flex">
              <span className="h-16 w-px bg-line" />
              <div className="flex flex-col gap-2.5 pb-1">
                <span className="h-px w-28 bg-line" />
                <span className="h-px w-28 bg-line" />
                <span className="h-px w-20 bg-line" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5 px-5 pb-10 sm:px-8 sm:pb-14 lg:px-14">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-extrabold">📦 컨셉 선택</h2>
          <span className="text-sm text-ink-faint">
            더 많은 컨셉이 순차적으로 열려요
          </span>
        </div>

        {isLoading && (
          <p className="text-sm text-ink-faint">컨셉을 불러오는 중이에요…</p>
        )}
        {isError && (
          <p className="text-sm text-ink-faint">
            컨셉 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </p>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {concepts?.map((concept, i) => (
              <div
                key={concept.id}
                className={`flex flex-col gap-3.5 rounded-2xl border border-dashed border-line bg-surface p-5 shadow-md transition-transform hover:-translate-y-1 hover:rotate-0 ${CARD_TILTS[i % CARD_TILTS.length]}`}
              >
                <div className="flex h-30 items-center justify-center rounded-xl bg-pink/40">
                  <svg width="40" height="40" viewBox="0 0 52 52" fill="none">
                    <rect x="6" y="14" width="40" height="28" rx="4" fill="#E85D4E" />
                    <path d="M6 16l20 16 20-16" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-[15px] font-extrabold">{concept.name}</div>
                  <div className="mt-0.5 text-xs text-ink-faint">
                    {concept.description || "지금 촬영 가능"}
                  </div>
                </div>
                <Link href={`/booth/${concept.id}/capture`}>
                  <Button className="w-full">촬영 시작</Button>
                </Link>
              </div>
            ))}

            {Array.from({ length: placeholderCount }).map((_, i) => (
              <div
                key={`placeholder-${i}`}
                className="flex flex-col gap-3.5 rounded-2xl border border-dashed border-line bg-paper-soft p-5 opacity-75"
              >
                <div className="flex h-30 items-center justify-center rounded-xl bg-[#E6E2F0]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="10" width="14" height="10" rx="2" stroke="#9C9AA8" strokeWidth="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#9C9AA8" strokeWidth="2" />
                  </svg>
                </div>
                <div>
                  <div className="text-[15px] font-extrabold text-ink-faint">
                    새 컨셉
                  </div>
                  <div className="mt-0.5 text-xs text-[#ACA9BB]">곧 오픈</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Dear, Photo가 하는 일 소개 */}
      <section className="flex flex-col gap-7 px-5 pb-14 sm:px-8 lg:px-14">
        <div className="text-center">
          <h2 className="text-xl font-extrabold sm:text-2xl">Dear, Photo는 이렇게 이용해요</h2>
          <p className="mt-1.5 text-sm text-ink-faint">
            네컷 사진을 찍고 꾸며서, 소포처럼 다이어리 우편함에 배달하는 포토부스예요
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative">
              {/* 뒤에 겹쳐진 카드 두 장으로 종이 더미 같은 입체감을 낸다 */}
              <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-2 rounded-2xl border border-line bg-paper-soft" />
              <div className="absolute inset-0 translate-x-0.5 translate-y-0.5 -rotate-1 rounded-2xl border border-line bg-surface" />
              <div className="relative flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-6 shadow-lg">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-pink text-xl">
                  {step.emoji}
                </span>
                <span className="text-xs font-bold text-coral-dark">STEP {i + 1}</span>
                <h3 className="font-extrabold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-ink-faint">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
