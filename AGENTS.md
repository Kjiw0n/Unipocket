# UniPocket — CLAUDE.md

교환학생 맞춤형 통합 가계부 서비스. 국내/해외 카드와 현금을 한 번에 관리하며, OCR·CSV 자동 분류, 대시보드 위젯, 동일 국가 학생과의 소비 비교 기능을 제공한다.

---

## 역할 분담

이 저장소는 FE(frontend/) + BE(backend/) 모노레포다.  
**나는 프론트엔드만 작업한다. 백엔드는 FE 버그 해결에 필요한 경우에만 참조한다.**

FE 작업 세부사항은 `frontend/CLAUDE.md` 참고.

---

## 기술 스택

**Backend (참조 전용)**: Java 17, Spring Boot, JPA, QueryDSL, MySQL, Gradle

**배포**: GitHub Actions → Vercel (FE) / Google Cloud GCP (BE)

---

## 작업 원칙

- 작업 전 관련 코드 흐름과 문서를 먼저 확인한다.
- 원인이 불명확하면 바로 수정하지 말고 재현 조건과 원인 후보를 먼저 정리한다.
- 수정 범위는 최소화한다.
- 수정 후 동일 플로우 기준으로 검증한다.

---

## 커밋 규칙

- 형식: `feat: 작업 내용` / `fix:` / `refactor:` / `chore:` (상세 설명 필요 시 `-m "- 내용"` 추가)
- Co-Authored-By 추가 금지
- **develop 브랜치에서 직접 커밋하는 경우** PR 타이틀 규칙을 따른다: `[FEAT] 작업 내용` / `[FIX]` / `[REFACTOR]` / `[CHORE]`

---

## 개인 이슈 관리

로컬 `docs/personal/issue/` 폴더에서 관리. `.gitignore`로 공개 repo에서 제외됨.

이슈 작업 요청 시 행동 규칙은 `docs/personal/issue/CLAUDE.md`에 정의되어 있다.

---

## 주의사항

- 백엔드 코드(`backend/`)는 FE 오류 디버깅 목적 외에 수정하지 않는다.
