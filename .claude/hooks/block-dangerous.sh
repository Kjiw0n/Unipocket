#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

block() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

echo "$COMMAND" | grep -qP 'rm\s+-[a-z]*r[a-z]*f\s+(/|~)' && block "rm -rf on / or ~ is blocked"
echo "$COMMAND" | grep -qP 'git\s+push\s+.*(--force|-f)\s+.*(main|develop)' && block "Force-push to main/develop is blocked"
echo "$COMMAND" | grep -qP 'git\s+push\s+.*(main|develop).*(--force|-f)' && block "Force-push to main/develop is blocked"
echo "$COMMAND" | grep -qP '\bdd\b.+of=/dev/' && block "dd to device node is blocked"

exit 0
