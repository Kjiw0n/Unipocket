#!/bin/bash
set -uo pipefail
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# git commit 명령만 가로챔 (--amend는 제외)
echo "$COMMAND" | grep -qE '(^|&&|;|\|)[[:space:]]*git[[:space:]]+commit([[:space:]]|$)' || exit 0
echo "$COMMAND" | grep -qE 'git[[:space:]]+commit[[:space:]].*--amend\b' && exit 0

deny() {
  jq -n --arg r "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $r
    }
  }'
  exit 0
}

cd "$(echo "$INPUT" | jq -r '.cwd // ""')/frontend" 2>/dev/null || exit 0
pnpm lint >/tmp/lint.log 2>&1 || deny "커밋 전 lint 실패. frontend에서 'pnpm lint:fix' 후 재시도. (로그: /tmp/lint.log)"
exit 0
