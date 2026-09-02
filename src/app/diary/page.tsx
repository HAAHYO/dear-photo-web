"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/widgets/Header";
import { Button } from "@/shared/ui/Button";
import { useAuth } from "@/shared/auth/AuthContext";
import { getDiaryEntries } from "@/shared/api/diary";
import { getPhotoDownloadUrl } from "@/shared/api/photos";

export default function DiaryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthLoading, isAuthenticated, router]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["diary", "list", user?.id],
    queryFn: () => getDiaryEntries(user!.id),
    enabled: isAuthenticated && !!user,
    retry: false,
  });

  if (isAuthLoading || !isAuthenticated) return null;

  return (
    <main className="flex min-h-screen flex-col">
      <Header />

      <section className="flex flex-col gap-7 px-14 py-11">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[26px] font-extrabold">
              {user?.nickname ?? "회원"}님의 다이어리
            </h1>
            <p className="mt-1.5 text-sm text-ink-faint">
              저장한 사진 {data?.totalElements ?? 0}장 · 전체 비공개
            </p>
          </div>
          <div className="flex items-center gap-3.5">
            <span className="rounded-full bg-[#EDEAE1] px-3 py-1.5 text-xs font-bold text-ink-soft">
              🔒 비공개 (Phase 2에서 공개범위 선택 가능)
            </span>
            <Link href="/">
              <Button>+ 새 촬영하러 가기</Button>
            </Link>
          </div>
        </div>

        {isLoading && (
          <p className="text-sm text-ink-faint">다이어리를 불러오는 중이에요…</p>
        )}

        {isError && (
          <p className="text-sm text-ink-faint">
            다이어리 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </p>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-2 gap-4.5 sm:grid-cols-3 lg:grid-cols-6">
            {data?.content.map((entry) => (
              <div
                key={entry.id}
                className="overflow-hidden rounded-2xl bg-surface shadow-sm transition-transform hover:-translate-y-1.5 hover:shadow-lg"
              >
                <div
                  className="relative h-45 bg-cover bg-center bg-paper-soft"
                  style={{ backgroundImage: `url(${getPhotoDownloadUrl(entry.photoId)})` }}
                />
                <div className="p-3">
                  <div className="text-xs font-bold">
                    {new Date(entry.createdAt).toLocaleDateString("ko-KR", {
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-ink-soft">
                    {entry.content}
                  </p>
                </div>
              </div>
            ))}

            <Link
              href="/"
              className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-sm font-bold text-ink-faint transition-colors hover:border-coral hover:bg-[#FBEAE6] hover:text-coral-dark"
            >
              <span className="text-2xl">＋</span>새 컷 촬영하기
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
