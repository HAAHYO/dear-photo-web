"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "@/widgets/Header";
import { Button } from "@/shared/ui/Button";
import { useAuth } from "@/shared/auth/AuthContext";
import { logout as logoutRequest, withdraw } from "@/shared/api/auth";

export default function MyPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, user, clearUser } = useAuth();
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthLoading, isAuthenticated, router]);

  if (isAuthLoading || !isAuthenticated || !user) return null;

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // 서버 로그아웃 실패해도 클라이언트 세션은 정리한다
    } finally {
      clearUser();
      toast.success("로그아웃되었습니다.");
      router.push("/");
    }
  }

  async function handleWithdraw() {
    if (!user) return;
    if (!confirm("정말 탈퇴하시겠어요? 저장된 다이어리는 모두 사라져요.")) return;

    setIsWithdrawing(true);
    try {
      await withdraw(user.id);
      clearUser();
      toast.success("탈퇴가 완료되었습니다.");
      router.push("/");
    } catch (error) {
      toast.error("탈퇴에 실패했어요.", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsWithdrawing(false);
    }
  }

  return (
    <main className="mail-dot-bg flex min-h-screen flex-col">
      <Header />

      <section className="flex flex-col gap-6 px-5 py-8 sm:px-8 sm:py-11 lg:px-14">
        <h1 className="text-[26px] font-extrabold">📇 마이페이지</h1>

        <div className="airmail-frame max-w-lg shadow-md">
          <div className="flex flex-col gap-5 bg-surface p-6 sm:p-8">
            <div>
              <span className="text-xs font-bold text-ink-faint">닉네임</span>
              <p className="mt-1 text-lg font-extrabold">{user.nickname}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-ink-faint">이메일</span>
              <p className="mt-1 text-sm text-ink-soft">{user.email}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-ink-faint">가입일</span>
              <p className="mt-1 text-sm text-ink-soft">
                {new Date(user.createdAt).toLocaleDateString("ko-KR")}
              </p>
            </div>

            <div className="mt-2 flex flex-col gap-2.5 border-t border-dashed border-line pt-5">
              <Button variant="ghost" onClick={handleLogout} className="w-full">
                로그아웃
              </Button>
              <Button
                variant="outline"
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="w-full !border-coral !text-coral-dark hover:!bg-coral hover:!text-white"
              >
                회원 탈퇴
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
