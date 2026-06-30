Create a PR for the current branch. Show a draft to the user first and wait for approval before actually creating it.

## Steps

1. Get current branch: `git branch --show-current`
2. Get commits since develop: `git log develop...HEAD --oneline`
3. Get changed files: `git diff develop...HEAD --stat`
4. Check `docs/personal/issue/backlog.md` for any issues in "진행 중인 이슈" or recently moved to "완료된 이슈" that are relevant to this branch
5. If a relevant issue file is found, read it to understand the context
6. Draft the PR — title and body:

   **Title format**: `[TYPE] brief description`
   - Types: `FIX` / `FEAT` / `REFACTOR` / `CHORE`
   - No `[FE]` prefix
   - Keep it under 70 characters

   **Body**: follow the structure in `.github/pull_request_template.md`

7. Show the draft to the user. Ask: "이 내용으로 PR 올릴까요? 수정할 부분 있으면 말해줘요."
8. Apply any feedback the user gives
9. Once the user approves, run:
   ```
   gh pr create --base develop --title "..." --body "..."
   ```

## Rules

- Never add Co-Authored-By to anything
- Base branch is always `develop`
- Do not create the PR until the user explicitly approves the draft
- If the issue file has a "배경" or "문제 상황" section, use it to fill 배경
