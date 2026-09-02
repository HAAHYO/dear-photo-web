import axios, { AxiosError } from "axios";

// 실제 배포된 Dear Photo 백엔드 (Swagger: /swagger-ui/index.html)
const DEFAULT_API_BASE_URL =
  "https://port-0-dear-photo-server-mt8m1nf65d1ed698.sel3.cloudtype.app";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  timeout: 10_000,
  // 세션 쿠키(JSESSIONID) 기반 인증이라 매 요청에 쿠키를 실어보내야 한다
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string }>) => {
    const message =
      error.response?.data?.message ?? error.message ?? "알 수 없는 오류";
    return Promise.reject(new Error(message));
  }
);
