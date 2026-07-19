# Frontend

## 기술 스택

| 분류 | 도구 |
|------|------|
| 빌드 | Next.js 16 (App Router), pnpm |
| 언어 | TypeScript 5.9, React 19 |
| 라우팅 | Next.js App Router |
| 서버 상태 | TanStack Query v5 |
| 테이블 | TanStack Table v8 |
| 전역 상태 | Zustand v5 |
| 스타일 | Tailwind CSS v4, shadcn/ui (Radix UI 기반) |
| 애니메이션 | Framer Motion |
| 아이콘 | Lucide React |
| 토스트 | Sonner |
| 모니터링 | Sentry (`@sentry/nextjs`) |
| 테스트 | Vitest |
| 린트/포맷 | ESLint 9 (flat config) + Prettier |

---

## 프로젝트 구조

```
src/
├── api/           # 도메인별 API 호출 함수 + TanStack Query 훅
│   ├── account-books/
│   ├── auth/
│   ├── cards/
│   ├── expenses/
│   ├── temporary-expenses/
│   ├── travels/
│   ├── users/
│   └── widget/
├── app/           # App Router 페이지, 레이아웃, 전역 프로바이더
├── assets/        # 이미지, SVG 아이콘 (@svgr/webpack으로 컴포넌트 임포트)
├── components/    # 도메인별 + 공통 UI 컴포넌트
├── constants/     # 앱 전역 상수
├── data/          # 정적/샘플 데이터
├── hooks/         # 커스텀 훅
├── lib/           # 유틸리티 함수
├── screens/       # App Router 페이지가 렌더하는 화면 컴포넌트
├── stores/        # Zustand 스토어
├── styles/        # 전역 CSS
├── test/          # Vitest 단위 테스트
└── types/         # 공유 타입 정의
```

---

## 개발 명령어

`frontend/` 디렉토리에서 실행한다.

```bash
pnpm dev          # 개발 서버 (localhost:5173)
pnpm build        # Next.js 프로덕션 빌드
pnpm start        # Next.js 프로덕션 서버
pnpm typecheck    # Next 타입 생성 + TypeScript 검사
pnpm test         # Vitest 실행
pnpm lint         # ESLint 검사
pnpm lint:fix     # ESLint 자동 수정
pnpm format       # Prettier 포맷
```

---

## 환경 변수

`frontend/.env.development` / `frontend/.env.production` 에 정의.

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_API_BASE_URL` | API 요청 base URL (dev/prod 모두 `/api` — Next rewrites가 BE로 전달) |
| `API_PROXY_TARGET` | API rewrite 대상 URL (서버 전용) |
| `CDN_PROXY_TARGET` | CDN rewrite 대상 URL (서버 전용) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 측정 ID |
| `NEXT_PUBLIC_CONTENTSQUARE_KEY` | ContentSquare 사이트 키 |
| `NEXT_PUBLIC_COOKIE_DOMAIN` | 프로덕션 게스트 로그인 쿠키 도메인 |
| `NEXT_PUBLIC_DEV_USER_ID` | 게스트 로그인 사용자 ID |
| `SENTRY_AUTH_TOKEN` | Sentry 소스맵 업로드 토큰 (프로덕션 빌드 전용) |
| `SENTRY_ORG` / `SENTRY_PROJECT` | Sentry 프로젝트 식별자 |
| `SHARE_LINK_SECRET` | 리포트 공유 링크 HMAC 서명용 서버 전용 시크릿 |
| `SITE_URL` | 공유 페이지 OG 메타데이터 절대 URL 기준이 되는 배포 origin |

로컬 개발·배포 환경 모두 `/api/*`, `/cdn-assets/*` 요청은 `next.config.ts` rewrite를 통해 전달된다.

---

## 경로 별칭

`@` → `src/` (`tsconfig.json` paths 설정)

```ts
import { useExpenses } from '@/hooks/expense';
```

---

## 라우팅 규칙

Next.js App Router를 사용한다.

- `src/app/(app)/`: 인증 필요 페이지 (home, report, setting, travel, init)
- `src/app/(auth)/`: 비인증 페이지 (랜딩, 로그인)
- `AuthGuard`/`GuestGuard`가 클라이언트에서 인증·계정부 상태를 확인한다.

---

## API 패턴

각 도메인 폴더(`src/api/<domain>/`) 안에 `api.ts`(순수 fetch 함수), `query.ts`(TanStack Query 훅), `type.ts`(해당 도메인 타입 정의)를 분리한다.

해당 엔티티에 이미 `queryOptions`가 있으면 raw `customFetch` 대신 `queryClient.fetchQuery`/`useQuery`로 캐시를 경유한다. 항상 최신값이 필요한 등 예외는 코드 주석으로 근거를 남긴다.

---

## 상태 관리

- **서버 상태**: TanStack Query
- **클라이언트 전역 상태**: Zustand (`src/stores/`)
  - `accountBookStore`: 현재 가계부 선택 상태
  - `parseSnackbarStore`: OCR/파일 파싱 진행 상태 스낵바
  - `refreshStore`: 데이터 새로고침 트리거

---

## SVG 사용

`@svgr/webpack`으로 SVG를 React 컴포넌트로 임포트한다.

```ts
import LogoIcon from '@/assets/logo.svg';
// <LogoIcon /> 형태로 사용
```

---

## 주의사항

- `next-env.d.ts`와 `.next/`는 Next.js가 생성하는 파일이므로 직접 수정하지 않는다.
- Sentry 설정은 `instrumentation-client.ts`, `instrumentation.ts`, `sentry.server.config.ts`와 `next.config.ts`에서 관리한다.
