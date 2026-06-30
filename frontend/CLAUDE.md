# Frontend

## 기술 스택

| 분류 | 도구 |
|------|------|
| 빌드 | Vite 7, pnpm |
| 언어 | TypeScript 5.9, React 19 |
| 라우팅 | TanStack Router v1 (파일 기반, 자동 코드 스플리팅) |
| 서버 상태 | TanStack Query v5 |
| 테이블 | TanStack Table v8 |
| 전역 상태 | Zustand v5 |
| 스타일 | Tailwind CSS v4, shadcn/ui (Radix UI 기반) |
| 애니메이션 | Framer Motion |
| 아이콘 | Lucide React |
| 토스트 | Sonner |
| 모니터링 | Sentry (`@sentry/react`) |
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
├── assets/        # 이미지, SVG 아이콘 (vite-plugin-svgr로 컴포넌트 임포트)
├── components/    # 도메인별 + 공통 UI 컴포넌트
├── constants/     # 앱 전역 상수
├── data/          # 정적/샘플 데이터
├── hooks/         # 커스텀 훅
├── lib/           # 유틸리티 함수
├── pages/         # 페이지 컴포넌트 (라우트 컴포넌트와 1:1 대응)
├── routes/        # TanStack Router 파일 기반 라우트 정의
│   ├── __root.tsx
│   ├── _app/      # 인증 필요 라우트 (home, report, setting, travel)
│   └── _auth/     # 비인증 라우트 (login, index)
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
pnpm build        # 프로덕션 빌드 (tsc + vite build)
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
| `VITE_API_PROXY_TARGET` | API 서버 URL (dev: localhost, prod: api.unipocket.co.kr) |
| `SENTRY_AUTH_TOKEN` | Sentry 소스맵 업로드 토큰 (프로덕션 빌드 전용) |
| `SENTRY_ORG` / `SENTRY_PROJECT` | Sentry 프로젝트 식별자 |

로컬 개발 시 `/api/*` 요청은 Vite 프록시를 통해 백엔드로 전달된다.

---

## 경로 별칭

`@` → `src/` (`vite.config.ts`의 `resolve.alias` 설정)

```ts
import { useExpenses } from '@/hooks/expense';
```

---

## 라우팅 규칙

TanStack Router 파일 기반 라우팅. `routeTree.gen.ts`는 자동 생성 파일 — 직접 수정하지 않는다.

- `_app` 레이아웃: 로그인 필요 페이지
- `_auth` 레이아웃: 비로그인 전용 페이지 (로그인, 랜딩)

---

## API 패턴

각 도메인 폴더(`src/api/<domain>/`) 안에 `api.ts`(순수 fetch 함수), `query.ts`(TanStack Query 훅), `type.ts`(해당 도메인 타입 정의)를 분리한다.

---

## 상태 관리

- **서버 상태**: TanStack Query
- **클라이언트 전역 상태**: Zustand (`src/stores/`)
  - `accountBookStore`: 현재 가계부 선택 상태
  - `parseSnackbarStore`: OCR/파일 파싱 진행 상태 스낵바
  - `refreshStore`: 데이터 새로고침 트리거

---

## SVG 사용

`vite-plugin-svgr`로 SVG를 React 컴포넌트로 임포트한다.

```ts
import LogoIcon from '@/assets/logo.svg';
// <LogoIcon /> 형태로 사용
```

---

## 주의사항

- `routeTree.gen.ts`는 자동 생성 파일 — 손대지 않는다.
- 프로덕션 빌드 시에만 Sentry 플러그인이 활성화된다 (`mode === 'production'`).
