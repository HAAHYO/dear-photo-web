import type { Metadata } from "next";
import Script from "next/script";
import Providers from "./providers";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dear, Photo",
  description: "포토부스에서 찍은 사진을 나만의 다이어리로 배달해요",
};

// 저장된 테마를 하이드레이션 전에 <html>에 미리 반영해 라이트→다크 깜빡임을 막는다.
// 시스템 다크모드는 절대 참조하지 않는다 — localStorage에 사용자가 직접 고른 값만 따른다.
const THEME_INIT_SCRIPT = `
try {
  var theme = localStorage.getItem("dear-photo-theme");
  if (theme === "dark") document.documentElement.dataset.theme = "dark";
} catch (e) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 사이트가 직접 라이트/다크를 관리한다고 브라우저에 알려서, 크롬 등이
            OS 다크 설정을 보고 페이지를 임의로 강제 다크화하는 걸 막는다 */}
        <meta name="color-scheme" content="light dark" />
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <ThemeToggle />
      </body>
    </html>
  );
}
