// Google Identity Services(GIS) 스크립트가 전역에 주입하는 API 중
// 우리가 실제로 쓰는 부분(OAuth code client)만 최소한으로 선언한다.
export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient(config: {
            client_id: string;
            scope: string;
            ux_mode?: "popup" | "redirect";
            callback: (response: { code?: string; error?: string }) => void;
          }): { requestCode: () => void };
        };
      };
    };
  }
}
