"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { UserResponse } from "@/shared/api/auth";

type AuthState = {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserResponse) => void;
  clearUser: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

const USER_KEY = "dearphoto:user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 인증은 세션 쿠키가 진짜 출처지만, 새로고침 사이 화면 상태를 위해
    // 마지막으로 로그인한 사용자 정보만 로컬에 캐시해둔다.
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUserState(JSON.parse(raw));
      } catch {
        // 저장된 값이 손상됐다면 무시하고 로그아웃 상태로 둔다
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const setUser = useCallback((next: UserResponse) => {
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    setUserState(next);
  }, []);

  const clearUser = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        setUser,
        clearUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
