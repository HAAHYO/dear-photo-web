"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/shared/ui/Button";
import { PostmarkStamp } from "@/shared/ui/PostmarkStamp";
import { useAuth } from "@/shared/auth/AuthContext";
import { login, signup } from "@/shared/api/auth";

type Mode = "login" | "signup";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === "signup" && password !== passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        const user = await signup({ email, password, nickname });
        setUser(user);
        toast.success("회원가입이 완료됐어요.");
        router.push("/diary");
        return;
      }

      const user = await login({ email, password });
      setUser(user);
      toast.success("로그인되었습니다.");
      router.push("/diary");
    } catch (error) {
      toast.error(mode === "signup" ? "회원가입에 실패했습니다." : "로그인에 실패했습니다.", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* 왼쪽 안내 패널: 사이트 테마와 무관하게 항상 어두운 "밤편지" 톤으로 고정 */}
      <div className="relative hidden w-[560px] flex-col justify-between overflow-hidden bg-[#211f2b] p-14 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1.4px, transparent 1.4px)",
            backgroundSize: "22px 22px",
          }}
        />

        <Link href="/" className="relative flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="6" width="24" height="17" rx="3" fill="#E85D4E" />
            <path d="M2 7l12 10 12-10" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="14" cy="4.5" r="3.2" fill="#F5D547" />
          </svg>
          <span className="text-lg font-extrabold">Dear, Photo</span>
        </Link>

        <div className="relative">
          <p className="text-3xl leading-snug font-extrabold">
            촬영한 사진을 다이어리에
            <br />
            차곡차곡 배달해두세요
          </p>
          <p className="mt-3.5 text-sm text-[#B8B2A8]">
            로그인하면 편집한 사진을 저장하고, 나만의 다이어리에서 다시
            꺼내볼 수 있어요.
          </p>
        </div>

        <div className="relative flex items-end gap-4">
          <div className="tape -top-2.5 left-4 rotate-[-9deg]" />
          <div className="-rotate-3 rounded-sm bg-white p-2 pb-5 shadow-lg">
            <div className="h-32 w-24 rounded-sm bg-lemon" />
          </div>
          <div className="tape -top-3 left-28 rotate-[7deg]" />
          <div className="mb-4 rotate-2 rounded-sm bg-white p-2 pb-5 shadow-lg">
            <div className="h-32 w-24 rounded-sm bg-coral" />
          </div>
          <div className="rotate-[-4deg] rounded-sm bg-white p-2 pb-5 shadow-lg">
            <div className="h-32 w-24 rounded-sm bg-mint" />
          </div>
          <PostmarkStamp className="absolute -top-6 right-0 h-20 w-20 rotate-6 text-white opacity-90" />
        </div>
      </div>

      <div className="mail-dot-bg flex flex-1 items-center justify-center px-6 py-14">
        <form onSubmit={handleSubmit} className="airmail-frame w-full max-w-[420px] shadow-lg">
          <div className="flex flex-col gap-5.5 bg-surface p-7 sm:p-9">
            <div className="flex gap-1.5">
              <Link
                href="/login"
                className={`folder-tab flex-1 border px-4 py-2.5 text-center text-sm font-bold ${
                  mode === "login"
                    ? "border-line border-b-surface bg-surface text-ink"
                    : "border-transparent bg-transparent text-ink-faint hover:text-ink-soft"
                }`}
              >
                📨 로그인
              </Link>
              <Link
                href="/signup"
                className={`folder-tab flex-1 border px-4 py-2.5 text-center text-sm font-bold ${
                  mode === "signup"
                    ? "border-line border-b-surface bg-surface text-ink"
                    : "border-transparent bg-transparent text-ink-faint hover:text-ink-soft"
                }`}
              >
                ✍️ 회원가입
              </Link>
            </div>
            <div className="-mt-2.5 border-b border-line" />

          <div className="flex flex-col gap-3">
            {mode === "signup" && (
              <input
                type="text"
                required
                maxLength={20}
                placeholder="닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-3.5 text-sm text-ink outline-none focus:border-coral focus:ring-3 focus:ring-coral/15"
              />
            )}
            <input
              type="email"
              required
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-3.5 text-sm text-ink outline-none focus:border-coral focus:ring-3 focus:ring-coral/15"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="비밀번호 (8자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-3.5 text-sm text-ink outline-none focus:border-coral focus:ring-3 focus:ring-coral/15"
            />
            {mode === "signup" && (
              <input
                type="password"
                required
                placeholder="비밀번호 확인"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-3.5 text-sm text-ink outline-none focus:border-coral focus:ring-3 focus:ring-coral/15"
              />
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {mode === "signup" ? "회원가입" : "로그인"}
          </Button>

          {mode === "login" ? (
            <p className="text-center text-sm text-ink-faint">
              계정이 없으신가요?{" "}
              <Link href="/signup" className="font-bold text-coral-dark">
                회원가입
              </Link>
            </p>
          ) : (
            <p className="text-center text-sm text-ink-faint">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="font-bold text-coral-dark">
                로그인
              </Link>
            </p>
          )}

          <div className="h-px bg-line" />

            <p className="text-center text-sm leading-relaxed text-ink-faint">
              로그인 없이도 포토부스 촬영과 사진 다운로드는 바로 이용할 수
              있어요.
              <br />
              <Link href="/" className="font-bold text-coral-dark">
                → 그냥 둘러보기
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
