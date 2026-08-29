"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/shared/auth/AuthContext";
import { logout as logoutRequest } from "@/shared/api/auth";
import { toast } from "sonner";

const NAV_ITEMS = [
  { href: "/", label: "포토부스" },
  { href: "/diary", label: "마이다이어리" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, clearUser } = useAuth();

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

  return (
    <header className="flex items-center justify-between border-b border-line px-14 py-5">
      <Link href="/" className="flex items-center gap-2.5">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="2" y="6" width="24" height="17" rx="3" fill="#E85D4E" />
          <path
            d="M2 7l12 10 12-10"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="4.5" r="3.2" fill="#F5D547" />
        </svg>
        <span className="text-lg font-extrabold">Dear Photo</span>
      </Link>

      <nav className="flex gap-8">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm font-semibold transition-colors ${
              pathname === item.href
                ? "text-ink"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {isAuthenticated ? (
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-ink-soft">
            {user?.nickname ?? "회원"}님
          </span>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-line px-4 py-2 text-sm font-bold hover:border-ink"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <div className="flex gap-2.5">
          <Link
            href="/login"
            className="rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-bold hover:border-ink"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-coral px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_var(--color-coral-dark)]"
          >
            회원가입
          </Link>
        </div>
      )}
    </header>
  );
}
