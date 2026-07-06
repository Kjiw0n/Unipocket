# Unipocket 백엔드 배포 가이드 (GCP)

GCE VM 한 대에 docker compose로 백엔드 전체 스택을 올리는 구성이다.
이 디렉토리의 파일과 `.env`(시크릿, gitignore됨)만 있으면 `./deploy/deploy.sh` 한 번으로 배포된다.

## 아키텍처

```
[프론트: Vercel]  https://unipocket-ashy.vercel.app
        │  (크로스 도메인 — 쿠키 SameSite=None)
        ▼
[GCE VM: unipocket-server]  고정 IP 34.64.82.85
  └─ docker compose
       ├─ caddy   : 80/443 → app:8080 리버스 프록시,
       │            34.64.82.85.sslip.io 도메인으로 Let's Encrypt HTTPS 자동 발급
       ├─ app     : Spring Boot (Corretto 17, profile=dev)
       ├─ mysql   : 8.4 (볼륨 mysql_data)
       └─ redis   : alpine
[스토리지] GCS 버킷 unipocket-media-5ba3282c 를 S3 호환 API(HMAC 키)로 사용
```

| 항목 | 값 |
|---|---|
| GCP 프로젝트 | `project-5ba3282c-cfb6-463a-960` |
| VM | `unipocket-server` (e2-medium, `asia-northeast3-a`) |
| 서비스 URL | `https://34.64.82.85.sslip.io` |
| VM 내 배포 경로 | `~/unipocket/` |

## 파일 구성

| 파일 | 역할 |
|---|---|
| `deploy.sh` | jar 빌드 → VM으로 파일 복사 → compose 재기동 (원클릭 배포) |
| `docker-compose.prod.yml` | caddy / app / mysql / redis 4개 서비스 정의 |
| `Dockerfile` | jar를 얹는 실행 이미지 (Corretto 17 alpine) |
| `Caddyfile` | 리버스 프록시 + HTTPS 설정 |
| `.env.example` | 환경변수 템플릿 (값 없음, 커밋됨) |
| `.env` | 실제 시크릿 (**gitignore됨, 커밋 금지**) |
| `app.jar` | 빌드 산출물 (gitignore됨) |

## 사전 준비

1. **gcloud CLI 인증** — VM 접근 권한이 있는 계정으로 로그인한다.
   ```bash
   gcloud auth login
   gcloud config set project project-5ba3282c-cfb6-463a-960
   ```
2. **`.env` 작성** — 템플릿을 복사한 뒤 `<...>` 자리를 실제 값으로 채운다.
   ```bash
   cp backend/deploy/.env.example backend/deploy/.env
   ```
   실제 값은 저장소에 없다. 팀 내부 채널로 전달받거나 기존 운영자의 사본을 사용한다.
   (서버의 `~/unipocket/.env`에도 동일한 사본이 있으므로 거기서 가져와도 된다.)

## 배포

```bash
cd backend
./deploy/deploy.sh              # gradlew bootJar → scp → docker compose up -d --build
./deploy/deploy.sh --skip-build # jar 빌드 생략 (직전 빌드 재사용)
```

스크립트가 하는 일:
1. `./gradlew bootJar -x test` 로 `app.jar` 빌드
2. `gcloud compute scp` 로 jar + Dockerfile + compose + Caddyfile + `.env` 를 VM에 복사
3. VM에서 `docker compose up -d --build` 실행 후 컨테이너 상태 출력

`.env` 값만 바꾸는 경우에도 동일하게 실행하면 된다 (`--skip-build` 권장).

## 운영 명령

모든 명령은 VM에 SSH 접속 후 `~/unipocket` 에서 실행한다.

```bash
# SSH 접속
gcloud compute ssh unipocket-server --project=project-5ba3282c-cfb6-463a-960 --zone=asia-northeast3-a

# 컨테이너 상태 / 로그
sudo docker compose -f docker-compose.prod.yml ps
sudo docker compose -f docker-compose.prod.yml logs -f app

# 앱만 재시작 / 전체 재기동
sudo docker compose -f docker-compose.prod.yml restart app
sudo docker compose -f docker-compose.prod.yml up -d --build
```

## 환경변수

전체 목록과 기본값은 [`.env.example`](./.env.example) 참고. 주의가 필요한 항목만 정리한다.

| 변수 | 설명 |
|---|---|
| `AWS_*`, `SPRING_CLOUD_AWS_S3_*` | AWS가 아니라 **GCS의 S3 호환 API**를 쓴다. 엔드포인트를 `storage.googleapis.com`으로 고정하고 HMAC 키로 인증 |
| `COOKIE_SAME_SITE` | 프론트(Vercel)와 백엔드(sslip.io) 도메인이 달라 `None` 필수. 같은 도메인/프록시 구성으로 바뀌면 `Lax`로 되돌릴 것 |
| `COOKIE_DOMAIN` | 빈 값 = host-only 쿠키. 크로스 도메인 구성에서는 비워둔다 |
| `EXCHANGE_YAHOO_CHARTURL` | `query2` 호스트 사용 (아래 트러블슈팅 참고) |
| `GEMINI_API_KEY` | AI Studio에서 발급한 키. 무료 등급이라 쿼터 주의 |

## 트러블슈팅 (실제 겪은 문제들)

**Yahoo 환율 API 429 (봇 차단)**
데이터센터 IP에서는 Java 기본 User-Agent가 차단된다. 코드에서 단순 `Mozilla/5.0 ...` UA를 명시한다
(`ExchangeRateCommandServiceImpl`). Chrome 버전 토큰이 포함된 UA는 오히려 위장으로 판정되어 차단되므로 바꾸지 말 것.
또한 `query1` 호스트 자체가 차단되어 `.env`에서 `query2`를 사용한다.

**로그인 후 쿠키가 저장되지 않음**
프론트와 백엔드 도메인이 다르면 `SameSite=None; Secure` 쿠키여야 크로스 사이트 요청에 실린다.
`COOKIE_SAME_SITE=None` 확인. 로컬 개발(http)에서는 Secure 쿠키가 거부되므로 프론트 dev 모드는 `SameSite=Lax`를 쓴다.

**GCS HMAC 키 발급 불가 (서비스 계정)**
조직 정책 `iam.disableServiceAccountKeyCreation` 때문에 서비스 계정 HMAC 키를 만들 수 없다.
GCP Console > Cloud Storage > 설정 > **상호운용성** 탭에서 **사용자 계정** HMAC 키를 발급해 사용한다.

**presigned URL 업로드 CORS 오류**
GCS 버킷에 CORS 설정(GET/PUT/HEAD, 허용 오리진)이 있어야 한다. 프론트 도메인이 바뀌면
버킷 CORS 오리진도 함께 갱신할 것 (`gcloud storage buckets update --cors-file=...`).

**프론트 도메인 변경 시 체크리스트**
`FRONTEND_URL` / `FRONTEND_ALLOWED_ORIGINS` / OAuth redirect URI(`.env` + Google·Kakao 콘솔) /
GCS 버킷 CORS 오리진을 모두 갱신한 뒤 재배포한다.

## 시크릿 정책

- `.env`, `app.jar`는 gitignore되어 있다. **어떤 경우에도 커밋하지 않는다.**
- 새 변수를 추가하면 `.env.example`에도 값 없이 반영해 템플릿을 최신으로 유지한다.
