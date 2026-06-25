# UniPocket — CLAUDE.md

교환학생 맞춤형 통합 가계부 서비스. 국내/해외 카드와 현금을 한 번에 관리하며, OCR·CSV 자동 분류, 대시보드 위젯, 동일 국가 학생과의 소비 비교 기능을 제공한다.

---

## 역할 분담

이 저장소는 FE(frontend/) + BE(backend/) 모노레포다.  
**나는 프론트엔드만 작업한다. 백엔드는 FE 버그 해결에 필요한 경우에만 참조한다.**

---

## 기술 스택

### Frontend (주 작업 영역)

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

### Backend (참조 전용)

Java 17, Spring Boot, JPA, QueryDSL, MySQL, Gradle

### 배포

GitHub Actions → Vercel (FE) / Google Cloud(GCP) (BE)

---

## 프로젝트 구조

```
WEB-Team1-Unipocket/
├── frontend/          # 주 작업 영역
│   ├── src/
│   │   ├── api/           # 도메인별 API 호출 함수 + TanStack Query 훅
│   │   │   ├── account-books/
│   │   │   ├── auth/
│   │   │   ├── cards/
│   │   │   ├── expenses/
│   │   │   ├── temporary-expenses/
│   │   │   ├── travels/
│   │   │   ├── users/
│   │   │   └── widget/
│   │   ├── assets/        # 이미지, SVG 아이콘 (vite-plugin-svgr로 컴포넌트 임포트)
│   │   ├── components/    # 도메인별 + 공통 UI 컴포넌트
│   │   ├── constants/     # 앱 전역 상수
│   │   ├── data/          # 정적/샘플 데이터
│   │   ├── hooks/         # 커스텀 훅
│   │   ├── lib/           # 유틸리티 함수
│   │   ├── pages/         # 페이지 컴포넌트 (라우트 컴포넌트와 1:1 대응)
│   │   ├── routes/        # TanStack Router 파일 기반 라우트 정의
│   │   │   ├── __root.tsx
│   │   │   ├── _app/      # 인증 필요 라우트 (home, report, setting, travel)
│   │   │   └── _auth/     # 비인증 라우트 (login, index)
│   │   ├── stores/        # Zustand 스토어
│   │   ├── styles/        # 전역 CSS
│   │   ├── test/          # Vitest 단위 테스트
│   │   └── types/         # 공유 타입 정의
│   ├── vite.config.ts
│   └── package.json
└── backend/           # 참조 전용
```

---

## 개발 명령어

```bash
# frontend/ 디렉토리에서 실행
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

TanStack Router의 파일 기반 라우팅을 사용한다. `routeTree.gen.ts`는 자동 생성 파일이므로 직접 수정하지 않는다.

- `_app` 레이아웃: 로그인 필요 페이지
- `_auth` 레이아웃: 비로그인 전용 페이지 (로그인, 랜딩)

---

## API 패턴

각 도메인 폴더(`src/api/<domain>/`) 안에 `api.ts`(순수 fetch 함수)와 `query.ts`(TanStack Query 훅)를 분리한다.

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

- `routeTree.gen.ts` 는 자동 생성 파일 — 손대지 않는다.
- 백엔드 코드(`backend/`)는 FE 오류 디버깅 목적 외에 수정하지 않는다.
- 프로덕션 빌드 시에만 Sentry 플러그인이 활성화된다 (`mode === 'production'`).

---

## 작업 원칙

- 작업 전 관련 코드 흐름과 문서를 먼저 확인한다.
- 원인이 불명확하면 바로 수정하지 말고 재현 조건과 원인 후보를 먼저 정리한다.
- 수정 범위는 최소화한다.
- 수정 후 동일 플로우 기준으로 검증한다.
- 공개 문서에는 확인된 사실, 원인, 해결 방법, 검증 결과만 작성한다.

---

## 개인 이슈 관리

로컬에 `docs/personal/issue/` 폴더가 있고 사용자가 개인 이슈 기반 작업을 요청하면, `docs/personal/issue/README.md`를 먼저 읽고 그 규칙을 따른다.

`docs/personal/issue/`는 개인 작업 관리용 폴더이며 `.gitignore`에 의해 공개 repo에 올라가지 않는다. 이 폴더의 내용을 공개 문서에 그대로 인용하지 않는다.
