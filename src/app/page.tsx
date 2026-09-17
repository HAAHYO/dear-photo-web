"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Header from "@/widgets/Header";
import Footer from "@/widgets/Footer";
import { Button } from "@/shared/ui/Button";
import { PostmarkStamp } from "@/shared/ui/PostmarkStamp";
import { getConcepts } from "@/shared/api/concepts";

const NOTICES = [
  { date: "2026-09-02", title: "우편 컨셉으로 화면 전체를 새단장했어요" },
  { date: "2026-08-20", title: "다이어리 우편함에 스티커 꾸미기 기능이 추가됐어요" },
  { date: "2026-08-05", title: "베타 오픈: 로그인 없이도 촬영·다운로드가 가능해요" },
];

const QUICK_LINKS = [
  {
    href: "#concepts",
    label: "포토부스 바로가기",
    chip: "chip-coral",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 7l1.3-2h5.4L16 7" />
        <rect x="3" y="7" width="18" height="12.5" rx="2.5" />
        <circle cx="12" cy="13.2" r="3.6" />
      </svg>
    ),
  },
  {
    href: "/diary",
    label: "마이다이어리 우편함",
    chip: "chip-mint",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
        <path d="M8.5 8h7M8.5 11h4" />
      </svg>
    ),
  },
  {
    href: "/mypage",
    label: "마이페이지",
    chip: "chip-navy",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <circle cx="9" cy="11" r="2.1" />
        <path d="M5.3 16c.5-1.7 1.8-2.6 3.7-2.6s3.2.9 3.7 2.6" />
        <path d="M14.5 9.5h3M14.5 12h3" />
      </svg>
    ),
  },
  {
    href: "/how-it-works",
    label: "이용 방법 보기",
    chip: "chip-lemon",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l2.5 2.5" />
      </svg>
    ),
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
    <main className="flex min-h-screen flex-col">
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

      {/* 공지사항 + 바로가기 */}
      <section className="flex flex-col gap-5 px-5 pb-10 sm:px-8 lg:flex-row lg:px-14">
        <div className="flex-1 rounded-2xl border border-line bg-surface p-6 shadow-md sm:p-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold">📋 공지사항</h2>
            <Link
              href="/diary"
              className="flex items-center gap-0.5 text-xs font-bold text-ink-faint transition-colors hover:text-ink"
            >
              더보기 <span aria-hidden>›</span>
            </Link>
          </div>
          <ul className="flex flex-col">
            {NOTICES.map((notice, i) => (
              <li
                key={notice.title}
                className={`flex items-center gap-3 py-3 text-sm ${i > 0 ? "border-t border-dashed border-line" : ""}`}
              >
                <span className="shrink-0 rounded-full border border-line px-2.5 py-0.5 text-[11px] font-bold text-ink-soft">
                  공지
                </span>
                <span className="flex-1 truncate">{notice.title}</span>
                <span className="shrink-0 text-xs text-ink-faint">{notice.date}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:w-[380px] lg:shrink-0">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface p-5 text-center shadow-md transition-transform hover:-translate-y-1 hover:border-coral"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${link.chip}`}>
                {link.icon}
              </span>
              <span className="text-xs font-bold text-ink-soft">{link.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="concepts" className="flex scroll-mt-20 flex-col gap-5 px-5 pb-10 sm:px-8 sm:pb-14 lg:px-14">
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

      {/* Dear, Photo가 뭔지 한 줄 소개 + 자세히 보기 */}
      <section className="px-5 pb-14 sm:px-8 lg:px-14">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-gradient-to-r from-pink/50 via-surface to-surface px-6 py-5 shadow-md sm:flex-row sm:gap-5 sm:px-7">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
            📮
          </span>
          <p className="flex-1 text-center text-sm leading-relaxed text-ink-soft sm:text-left">
            <span className="font-extrabold text-ink">Dear, Photo</span>는 네컷 사진을 찍고 꾸며서,
            소포처럼 다이어리 우편함으로 배달하는 포토부스예요.
          </p>
          <Link href="/how-it-works" className="shrink-0">
            <Button variant="white" className="whitespace-nowrap">
              이용 방법 보기 →
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
