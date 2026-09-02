import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mail-dot-bg border-t border-line px-5 py-10 sm:px-8 lg:px-14">
      <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="shrink-0">
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
            <span className="font-extrabold">Dear, Photo</span>
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-ink-faint">
            네컷 사진을 찍고, 꾸미고, 다이어리 우편함으로 배달하는 포토부스 서비스예요.
            오늘의 한 장을 소포처럼 소중하게 보관해보세요.
          </p>
        </div>

        <div className="flex gap-12 sm:gap-16">
          <div>
            <span className="text-xs font-bold text-ink-faint">서비스</span>
            <ul className="mt-2.5 flex flex-col gap-2 text-sm text-ink-soft">
              <li>
                <Link href="/" className="hover:text-ink">
                  포토부스
                </Link>
              </li>
              <li>
                <Link href="/diary" className="hover:text-ink">
                  마이다이어리
                </Link>
              </li>
              <li>
                <Link href="/mypage" className="hover:text-ink">
                  마이페이지
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <span className="text-xs font-bold text-ink-faint">약관</span>
            <ul className="mt-2.5 flex flex-col gap-2 text-sm text-ink-soft">
              <li>
                <Link href="/privacy" className="hover:text-ink">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-ink">
                  이용약관
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-dashed border-line pt-5 text-xs text-ink-faint">
        © {new Date().getFullYear()} Dear, Photo. All rights reserved.
      </div>
    </footer>
  );
}
