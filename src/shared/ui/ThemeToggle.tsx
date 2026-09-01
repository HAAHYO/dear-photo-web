"use client";

import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "dear-photo-theme";

// 시스템 설정은 따르지 않는다 — 사용자가 이 버튼을 누르기 전까진 항상 라이트.
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark") {
      document.documentElement.dataset.theme = "dark";
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 저장된 테마를 읽어와 초기 표시 상태를 맞춘다
      setIsDark(true);
    }
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      aria-pressed={isDark}
      className="fixed right-4 bottom-20 z-50 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-base shadow-md transition-transform hover:-translate-y-0.5 sm:right-6 lg:bottom-6"
    >
      {isDark ? "🌙" : "☀️"}
    </button>
  );
}
