import { api } from "./axios";

export type SignupPayload = {
  email: string;
  password: string;
  nickname: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type UserResponse = {
  id: number;
  email: string;
  nickname: string;
  createdAt: string;
};

export async function signup(payload: SignupPayload): Promise<UserResponse> {
  const { data } = await api.post<UserResponse>("/auth/signup", payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<UserResponse> {
  const { data } = await api.post<UserResponse>("/auth/login", payload);
  return data;
}

// code: 구글 동의 화면 리다이렉트로 받은 1회용 authorization code (수명이 매우 짧음)
export async function googleLogin(code: string): Promise<UserResponse> {
  const { data } = await api.post<UserResponse>("/auth/google/login", { code });
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function withdraw(userId: number): Promise<void> {
  await api.delete("/users/me", { params: { userId } });
}
