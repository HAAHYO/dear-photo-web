"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/shared/auth/AuthContext";
import { logout as logoutRequest } from "@/shared/api/auth";
import { toast } from "sonner";
import { Button } from "@/shared/ui/Button";

function CameraIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
      <path d="M8 7l1.3-2h5.4L16 7" />
      <rect x="3" y="7" width="18" height="12.5" rx="2.5" />
      <circle cx="12" cy="13.2" r="3.6" />
    </svg>
  );
}

function NotebookIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
      <path d="M4.5 7.5h-1M4.5 11h-1M4.5 14.5h-1" />
      <path d="M8.5 8h7M8.5 11h4" />
      <path
        d="M9 16.8c-1.2-.8-2-1.7-2-2.7 0-.9.6-1.5 1.5-1.5.5 0 1 .3 1.3.7.3-.4.8-.7 1.3-.7.9 0 1.5.6 1.5 1.5 0 1-.8 1.9-2 2.7l-.8.5z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

function IdCardIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <circle cx="9" cy="11" r="2.1" />
      <path d="M5.3 16c.5-1.7 1.8-2.6 3.7-2.6s3.2.9 3.7 2.6" />
      <path d="M14.5 9.5h3M14.5 12h3" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/", label: "포토부스", Icon: CameraIcon },
  { href: "/diary", label: "마이다이어리", Icon: NotebookIcon },
  { href: "/mypage", label: "마이페이지", Icon: IdCardIcon },
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
    <>
      {/* 상단 바: 로고 + 다크모드/인증. 모바일에서는 네비 아이콘을 빼서 한 줄로 유지 */}
      <header className="flex items-center justify-between gap-x-4 border-b border-line px-5 py-4 sm:px-8 lg:px-14 lg:py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
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
          <span className="text-lg font-extrabold whitespace-nowrap">Dear, Photo</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_ITEMS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`group relative flex items-center justify-center rounded-full p-1.5 transition-colors ${
                pathname === href ? "text-coral-dark" : "text-ink-faint hover:text-ink"
              }`}
            >
              <Icon />
              <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2 scale-95 rounded-md bg-ink px-2 py-1 text-xs font-semibold whitespace-nowrap text-paper opacity-0 shadow-md transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
                {label}
              </span>
            </Link>
          ))}
        </nav>

        {isAuthenticated ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm font-semibold text-ink-soft sm:inline">
              {user?.nickname ?? "회원"}님
            </span>
            <Button variant="ghost" onClick={handleLogout} className="px-3 py-2 sm:px-4">
              로그아웃
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Link href="/login">
              <Button variant="white" className="px-3.5 py-2 sm:px-5 sm:py-2.5">
                로그인
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="px-3.5 py-2 sm:px-5 sm:py-2.5">회원가입</Button>
            </Link>
          </div>
        )}
      </header>

      {/* 하단 탭바: 모바일 전용. 상단 헤더가 줄바꿈으로 잘리는 대신 화면 아래 고정 */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-line bg-surface py-2 lg:hidden">
        {NAV_ITEMS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 text-[11px] font-semibold transition-colors ${
              pathname === href ? "text-coral-dark" : "text-ink-faint"
            }`}
          >
            <Icon />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
