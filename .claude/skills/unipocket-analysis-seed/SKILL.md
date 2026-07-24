---
name: unipocket-analysis-seed
description: UniPocket 분석 비교 기능의 시드 데이터를 API 경유로 안전하게 생성·확장·검증하는 스킬. 분석 스켈레톤, 비교군 부족, 국가별 시드 가계부, 특정 월(예: 8월·9월) 시드 추가, 기존 시드 재실행이나 배치 반영 확인을 요청할 때 사용한다.
---

# UniPocket 분석 시드

분석 "같은 국가 학생 소비 비교" 위젯은 대상 조합(local/base 국가·월)에 충분한 비교군 표본이 없으면 스켈레톤을 표시한다. 이 스킬은 그 비교군 시드 데이터를 **공개 API 경유로** 생성·검증한다. 원본 DB에 SQL을 직접 넣거나 백엔드 코드를 수정하지 않으며, 로컬 manifest로 멱등성을 유지한다.

프로젝트 규칙은 루트 `CLAUDE.md`와 `frontend/CLAUDE.md`를 따른다.

## 설계 원칙 (안전)

- **dry-run 우선**: 모든 쓰기는 `--execute` 없는 dry-run으로 변경 예정량(users/books/periodUpdates/expenses/total)을 먼저 확정하고, 사용자 승인 뒤에만 실행한다.
- **manifest 멱등성**: 생성한 사용자·가계부·거래 키를 로컬 manifest에 기록한다. 재실행·중간 실패 복구 시 중복 생성 없이 남은 작업만 이어서 처리한다.
- **최소 침습 가드레일**:
  - env 파일은 읽기만 하고 생성·수정·삭제하지 않는다.
  - 원본 DB에 raw SQL로 직접 삽입하지 않는다(분석 dirty 등록과 월 집계가 누락된다).
  - manifest에 기록된 시드 사용자·가계부만 자동 변경한다. 기간은 넓히기만 하고 줄이지 않는다.
- **경계 보호**: 데모 가계부와 실제 사용자 데이터는 명시적 허락 없이 기간·거래·국가를 변경하지 않는다.
- **실패 복구**: 중간에 실패해도 새 seed key를 발급하지 않는다. 같은 명령을 재실행해 manifest에서 이어간다.

## 실행 흐름

1. **대상 확인 (읽기 전용)**: 대상 조합·기간·현재 비교군 상태를 읽기 전용으로 확인한다. 토큰·개인정보는 출력하지 않는다. 최소 표본은 서로 다른 가계부 10개다.
2. **dry-run**: 스크립트를 `--execute` 없이 실행해 변경 예정량만 출력한다. 기존 시드 연장이면 `users`·`books`는 0, 새 월이면 `periodUpdates`가 시드 가계부 수만큼, `expenses`는 `peers × months × expenses-per-month`여야 한다. 예상과 다르면 실행하지 않고 manifest와 인자를 조사한다.
3. **실행**: 사용자가 요청한 범위와 dry-run이 일치할 때만 동일 명령에 `--execute`를 붙인다. 완료 후 manifest `remaining.total === 0`을 확인한다.
4. **원본 검증**: 각 시드의 거래 건수를 재조회해 월별 예상치와 맞는지 확인한다.
5. **배치 반영 보고**: 거래 생성 직후 분석 평균이 0인 것은 정상이다. dirty 행은 대상 국가 현지시각 다음 03:00 배치에서 처리된다. 배치 후 데모 가계부 분석 응답에서 비교군 평균과 카테고리 평균이 채워졌는지 LOCAL/BASE 양쪽으로 확인한다. 데모 본인 해당 월 지출이 0이면 비교군이 준비돼도 스켈레톤이 남으므로 별도 작업으로 보고하고 허락을 받는다.

## 실행 세부는 비공개

구체 실행 명령, API 조건, 현재 시드 식별자, 실행 스크립트(`seed-analysis.mjs`)와 manifest는 gitignore된 `docs/personal/seed/`에 있다.

- 상세 운영 문서: `docs/personal/seed/runbook.md`
- 실행 스크립트: `docs/personal/seed/seed-analysis.mjs`
- manifest: `docs/personal/seed/analysis-seed-manifest.json`

운영 엔드포인트·시드 식별자를 공개 저장소에 노출하지 않기 위해, 설계·안전 규칙(공개)과 실행 세부(비공개)를 분리한다. 실제 시딩을 수행할 때는 위 runbook을 먼저 전부 읽는다.
