@AGENTS.md

## 프로젝트 개요

- 이름: Dear, Photo (package.json 상 이름은 `lets-go-518-client`)
- 프레임워크: Next.js App Router + TypeScript — Next 16.2.4, React 19.2.4
- 스타일: Tailwind CSS v4 (`@theme inline` 기반 커스텀 토큰, `src/app/globals.css`)
- 백엔드: 별도 Spring 서버 (Swagger: `https://port-0-dear-photo-server-mt8m1nf65d1ed698.sel3.cloudtype.app/swagger-ui/index.html`), 세션 쿠키(JSESSIONID) 인증
- 목적: 포토부스에서 찍은 네컷 사진을 꾸며서 "다이어리 우편함"으로 배달하는 서비스. 전체 UI는 우체부/소포 배달 컨셉으로 통일

## 자주 사용하는 명령어

- `npm run dev` — 개발 서버 실행 (Turbopack)
- `npm run build` — 프로덕션 빌드. 코드 수정 후에는 `npx tsc --noEmit`과 `npm run build`로 타입 에러/빌드 실패가 없는지 반드시 확인
- `npm run lint` — ESLint (flat config, `eslint-config-next`)
- 테스트 러너는 아직 없음(별도 안내가 있기 전까지 테스트 관련 명령을 지어내지 말 것)

## 아키텍처

FSD 같은 레이어 구조는 아니고, 단순한 구조:

- `src/app/` — Next.js 라우팅. 페이지 컴포넌트가 UI를 직접 담고 있음 (`"use client"` 컴포넌트가 대부분)
  - `booth/[conceptId]/capture`, `booth/[conceptId]/edit` — 촬영 → 꾸미기 플로우
  - `diary`, `mypage`, `login`, `signup`, `privacy`, `terms`
- `src/widgets/` — 여러 라우트에서 공유하는 조합형 UI: `Header`(상단바 + 모바일 하단 탭바), `Footer`, `AuthForm`(로그인/회원가입 공용)
- `src/shared/api/` — `axios.ts`(공용 axios 인스턴스, `withCredentials: true`, 응답 에러를 `Error`로 정규화) + 도메인별 API 모듈(`auth`, `concepts`, `diary`, `photos`)
- `src/shared/auth/` — `AuthContext` (세션 쿠키가 실제 인증 출처이고, 새로고침 사이 화면 상태 유지를 위해 사용자 정보만 `localStorage`에 캐시)
- `src/shared/config/` — `queryClient.ts`, `storageKeys.ts`
- `src/shared/ui/` — 범용 컴포넌트: `Button`(variant: primary/ghost/outline/ink/white), `PostmarkStamp`(소인 스탬프 SVG), `ThemeToggle`

경로 별칭 `@/*` → `src/*` (`tsconfig.json`).

### 데이터 페칭

- 모든 HTTP 호출은 `src/shared/api/axios.ts`의 공용 `api` 인스턴스를 거친다.
- 서버 상태는 TanStack Query. 쿼리 에러는 `src/app/providers.tsx`의 `queryCache.onError`에서 토스트로 중앙 처리된다 — 개별 화면에서 또 에러 토스트를 띄우지 않아도 된다.
- 인증은 세션 쿠키 기반. `localStorage`/`sessionStorage`에서 값을 읽어 `JSON.parse`할 때는 항상 `try/catch`로 감쌀 것 (손상된 값으로 인한 런타임 에러 방지).

### 우편 컨셉 디자인 시스템

- 컬러 토큰은 `src/app/globals.css`의 `:root`에 정의 (`--color-coral`, `--color-lemon`, `--color-mint`, `--color-ink`, `--color-paper`, `--color-line`, `--color-surface` 등). 새 UI에서 `bg-white`를 하드코딩하지 말고 `bg-surface`를 사용할 것 — 다크모드 대응이 이 토큰에 달려 있다.
- 다크모드는 `<html data-theme="dark">`로 제어되며 시스템 설정(`prefers-color-scheme`)은 절대 따라가지 않는다. 토글은 `src/shared/ui/ThemeToggle.tsx`(우측 하단 플로팅 버튼), 저장 키는 `localStorage["dear-photo-theme"]`. `src/app/layout.tsx`의 `THEME_INIT_SCRIPT` 인라인 스크립트가 하이드레이션 전에 테마를 미리 적용해 깜빡임을 막는다 — 이 스크립트를 제거하거나 클라이언트 컴포넌트 로직으로 옮기지 말 것.
- 우편 모티프 재사용 유틸(`globals.css`): `.mail-dot-bg`(도트 배경), `.tape`(테이프), `.airmail-frame`(항공우편 대각선 테두리), `.folder-tab`(폴더탭 모양 탭 전환). 새 카드/섹션을 만들 때 이 톤을 유지할 것.
- 폰트는 Pretendard (jsdelivr CDN, `globals.css` 최상단 `@import`).

## 코드 규칙

- 클라이언트 상호작용이 있는 컴포넌트는 `"use client"` 명시
- 상태 관리: 로컬은 `useState`, 서버 상태는 TanStack Query, 전역 인증 상태는 `AuthContext` — Redux/Zustand 등 별도 상태 라이브러리 도입 금지
- CSS는 Tailwind 유틸리티 우선. 캔버스 픽셀 크기, `aspect-ratio`처럼 Tailwind로 표현하기 어려운 동적 값에 한해서만 인라인 `style` 허용
- `<button>` 등 클릭 가능한 요소에는 `cursor-pointer`를 빠뜨리지 말 것 (Tailwind preflight가 버튼 기본 커서를 초기화함)
- 원격/사용자 업로드 이미지처럼 `next/image` 최적화 대상이 아닌 경우를 제외하면 가능한 시맨틱하게 작성

## Git / PR 워크플로우

- **커밋·푸시는 사용자가 명시적으로 요청했을 때만 한다.** 코드/파일 변경까지는 바로 진행하되, `git commit`이나 `git push`는 먼저 "커밋할까요?"로 확인받은 뒤에만 실행한다. 사용자가 먼저 말하기 전에 알아서 커밋하지 말 것.
- PR에 코드리뷰 코멘트(자동 리뷰 봇 포함)가 달리면, 확인 후 반드시 해당 코멘트 스레드에 답글을 단다.
  - 실제로 수정했다면 어떤 커밋(해시)에서 고쳤는지 답글에 남긴다.
  - 지적이 틀렸거나(오탐) 재현이 안 되면, 확인한 근거(예: 빌드/타입체크 통과)와 함께 그 이유를 답글로 설명한다.
  - 코멘트에만 남기고 끝내지 말고, 실제 코드 수정 → (확인 후) 커밋 → 답글까지 한 세트로 처리한다.
- `main`/`develop`에 직접 push 금지. 항상 브랜치를 새로 파서 작업하고 PR로 올린다.
- PR이 이미 머지된 뒤에는 같은 브랜치에 커밋을 계속 쌓지 말고, 새 변경사항은 새 브랜치/새 PR로 올린다.

## 하지 말아야 할 것

- 사용자 확인 없이 커밋/푸시하지 말 것
- `.env*` 파일 커밋 금지 (`.gitignore`에 이미 포함되어 있음)
- 기존 API 엔드포인트나 스키마를 백엔드와 상의 없이 임의로 바꾸지 말 것
- `package.json`의 의존성 버전을 이유 없이 바꾸지 말 것
- 실제로 존재하지 않는 명령어/설정(테스트 러너 등)을 지어내서 문서화하지 말 것
