# UniPocket Frontend

Next.js 16 App Router 기반 프런트엔드입니다. 모든 화면은 클라이언트 컴포넌트로 유지하며, API와 CDN 요청은 `next.config.ts`의 rewrite를 통해 전달합니다.

## 개발

`frontend/`에서 실행합니다.

```bash
pnpm dev        # http://localhost:5173
pnpm build      # Next.js 프로덕션 빌드
pnpm start      # 프로덕션 서버
pnpm typecheck
pnpm test -- --run
pnpm lint
```

## 구조

- `src/app/`: App Router 페이지·레이아웃·프로바이더
- `src/screens/`: 페이지가 렌더하는 화면 컴포넌트
- `src/api/`: API 함수와 TanStack Query 훅
- `src/components/`: 도메인·공통 UI
- `src/config/env.ts`: 클라이언트 환경변수 접근 단일 지점

## 환경변수

클라이언트에 노출되는 값은 `NEXT_PUBLIC_` 접두사를 사용합니다. API와 CDN 프록시 대상은 각각 서버 전용 `API_PROXY_TARGET`, `CDN_PROXY_TARGET`으로 설정합니다. 로컬 `.env.*` 파일은 저장소에 포함하지 않습니다.
