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

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function withdraw(userId: number): Promise<void> {
  await api.delete("/users/me", { params: { userId } });
}
