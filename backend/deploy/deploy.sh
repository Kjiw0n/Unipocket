#!/usr/bin/env bash
# Unipocket 백엔드를 GCE VM(unipocket-server)에 배포한다.
# 사용법: backend/ 디렉토리에서  ./deploy/deploy.sh  (--skip-build 로 jar 빌드 생략)
set -euo pipefail

PROJECT=project-5ba3282c-cfb6-463a-960
ZONE=asia-northeast3-a
VM=unipocket-server
REMOTE_DIR=unipocket

cd "$(dirname "$0")/.."

if [[ "${1:-}" != "--skip-build" ]]; then
  ./gradlew bootJar -x test
fi
cp build/libs/app.jar deploy/app.jar

gcloud compute ssh "$VM" --project="$PROJECT" --zone="$ZONE" \
  --command="mkdir -p ~/$REMOTE_DIR"

gcloud compute scp --project="$PROJECT" --zone="$ZONE" \
  deploy/app.jar deploy/Dockerfile deploy/docker-compose.prod.yml deploy/Caddyfile deploy/.env \
  "$VM:~/$REMOTE_DIR/"

gcloud compute ssh "$VM" --project="$PROJECT" --zone="$ZONE" --command="
  cd ~/$REMOTE_DIR &&
  sudo docker compose -f docker-compose.prod.yml up -d --build &&
  sudo docker compose -f docker-compose.prod.yml ps
"
