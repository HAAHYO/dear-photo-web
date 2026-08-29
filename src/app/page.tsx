"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Header from "@/widgets/Header";
import { Button } from "@/shared/ui/Button";
import { getConcepts } from "@/shared/api/concepts";

export default function Home() {
  const { data: concepts, isLoading, isError } = useQuery({
    queryKey: ["concepts"],
    queryFn: getConcepts,
    retry: false,
  });

  const placeholderCount = Math.max(0, 5 - (concepts?.length ?? 0));

  return (
    <main className="flex min-h-screen flex-col">
      <Header />

      <section className="flex items-center justify-between gap-10 px-14 py-14">
        <div className="max-w-xl">
          <span className="mb-4 inline-block rounded-full bg-[#FBEAE6] px-3 py-1.5 text-xs font-bold text-coral-dark">
            로그인 없이 바로 촬영 가능
          </span>
          <h1 className="text-4xl leading-snug font-extrabold tracking-tight">
            오늘의 컨셉을 골라
            <br />
            네컷을 남겨보세요
          </h1>
          <p className="mt-3.5 leading-relaxed text-ink-soft">
            컨셉을 골라 촬영하고, 스티커와 그림을 더해 완성한 뒤
            다운로드하거나 로그인하고 다이어리에 저장하세요.
          </p>
        </div>
        <svg width="200" height="160" viewBox="0 0 220 180" fill="none" className="shrink-0">
          <rect x="30" y="20" width="90" height="120" rx="8" fill="#FFFFFF" stroke="#E3DFD5" strokeWidth="2" />
          <rect x="42" y="32" width="66" height="46" rx="4" fill="#F5D547" />
          <rect x="42" y="84" width="66" height="46" rx="4" fill="#8FD9C4" />
          <rect x="100" y="50" width="90" height="120" rx="8" fill="#FFFFFF" stroke="#E3DFD5" strokeWidth="2" transform="rotate(8 145 110)" />
          <rect x="112" y="62" width="66" height="46" rx="4" fill="#E85D4E" transform="rotate(8 145 85)" />
        </svg>
      </section>

      <section className="flex flex-col gap-5 px-14 pb-14">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-extrabold">컨셉 선택</h2>
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
          <div className="grid grid-cols-2 gap-4.5 sm:grid-cols-3 lg:grid-cols-5">
            {concepts?.map((concept) => (
              <div
                key={concept.id}
                className="flex flex-col gap-3.5 rounded-2xl border-2 border-coral bg-white p-5"
              >
                <div className="flex h-30 items-center justify-center rounded-xl bg-[#FBEAE6]">
                  <svg width="48" height="48" viewBox="0 0 52 52" fill="none">
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
                <div className="flex h-30 items-center justify-center rounded-xl bg-[#E6E2D6]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="10" width="14" height="10" rx="2" stroke="#9A9186" strokeWidth="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#9A9186" strokeWidth="2" />
                  </svg>
                </div>
                <div>
                  <div className="text-[15px] font-extrabold text-ink-faint">
                    새 컨셉
                  </div>
                  <div className="mt-0.5 text-xs text-[#B3AB9C]">곧 오픈</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
