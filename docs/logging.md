# 로그 확인 & CloudWatch Logs 연동

## 1. SSH로 즉시 확인 (에이전트 설치 불필요)

```bash
ssh -i your-key.pem ubuntu@<EC2-IP>
cd ~/lol_match   # docker-compose.yml이 있는 경로

docker compose logs -f backend      # 콘솔 출력 (app.log와 동일 내용)
docker compose logs -f frontend     # nginx access/error (기본 이미지가 stdout/stderr로 심볼릭 링크)

tail -f logs/backend/access.log     # ACCESS_LOG는 콘솔에 안 찍히므로 파일로만 확인 가능
tail -f logs/backend/error.log
```

## 2. 로그 파일 종류 & access.log 필드 해석

`logback-spring.xml` 기준으로 `logs/backend/`에 3가지 파일이 쌓인다.

- `app.log` — INFO 이상 전체 애플리케이션 로그 (콘솔 출력과 동일)
- `error.log` — ERROR만 별도 필터링
- `access.log` — [RequestLoggingFilter](../matching/matching/src/main/java/com/demo/matching/config/RequestLoggingFilter.java)가 찍는 요청 단위 로그. 모든 HTTP 요청에 한 줄씩 남고, LogstashEncoder라 JSON 한 줄 형식이다.

```json
{"@timestamp":"2026-07-10T12:32:57.86644221Z","@version":"1","message":"GET /api/streamers status=200 durationMs=1095 ip=211.207.78.95","logger_name":"ACCESS_LOG","thread_name":"http-nio-8080-exec-1","level":"INFO","level_value":20000,"requestId":"1029cb21-6ae4-40df-814a-a6a9e31d1178"}
```

| 필드 | 의미 |
|---|---|
| `@timestamp` | 요청 종료 시각(UTC) |
| `message` 안의 method/path | 호출된 API |
| `message` 안의 `status` | 응답 HTTP 상태 코드 |
| `message` 안의 `durationMs` | 요청 처리 소요 시간(ms) |
| `message` 안의 `ip` | `request.getRemoteAddr()` — TCP 연결의 실제 소켓 IP (스푸핑 가능한 `X-Forwarded-For` 헤더가 아님) |
| `thread_name` | 요청을 처리한 톰캣 워커 스레드 (동시 요청이면 서로 다른 값) |
| `requestId` | 요청마다 생성되는 UUID. 클라이언트가 받는 `X-Request-Id` 응답 헤더와 동일한 값이라 문제 발생 시 이 값으로 추적 가능 |

### 해석 팁
- `status`가 200이 아니면(4xx/5xx) 같은 시각대 `error.log`에서 같은 `requestId`를 찾아 원인을 확인한다: `grep <requestId> logs/backend/error.log`
- 같은 엔드포인트인데 유독 첫 요청만 `durationMs`가 크게(수백~수천ms) 튀고 이후엔 확 줄어드는 건 대부분 콜드 스타트(Hibernate 메타모델 초기화, DB 커넥션 풀 워밍업, JIT 워밍업) 때문이라 정상이다. 반대로 계속 느리면 실제 성능 문제로 봐야 한다.
- 같은 IP에서 짧은 간격으로 여러 엔드포인트가 호출되면 보통 프론트엔드 페이지 하나가 로드되며 여러 API를 동시에 fetch하는 정상 패턴이다.

## 3. CloudWatch Logs 연동 (콘솔에서 SSH 없이 검색)

### 2-1. IAM 권한 부여
EC2 인스턴스에 연결된 IAM 역할에 `CloudWatchAgentServerPolicy`를 붙인다.
- 역할이 없다면: IAM → 역할 생성 → EC2 → `CloudWatchAgentServerPolicy` 연결 → EC2 인스턴스에 역할 연결(EC2 콘솔 → 작업 → 보안 → IAM 역할 수정).

### 2-2. 에이전트 설치 (EC2 Ubuntu에서 SSH로 실행)
```bash
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
```

### 2-3. 설정 파일 배포
이 저장소의 [deploy/cloudwatch-agent-config.json](../deploy/cloudwatch-agent-config.json)을 EC2로 복사한다. `file_path`는 `docker-compose.yml`의 `./logs/backend` 바인드 마운트가 실제로 풀리는 절대경로(예: `/home/ubuntu/lol_match/logs/backend/*.log`)와 일치해야 하므로, 배포 경로가 다르면 수정할 것.

```bash
scp -i your-key.pem deploy/cloudwatch-agent-config.json ubuntu@<EC2-IP>:/tmp/config.json
ssh -i your-key.pem ubuntu@<EC2-IP>
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc
sudo mv /tmp/config.json /opt/aws/amazon-cloudwatch-agent/etc/config.json
```

### 2-4. 에이전트 시작
```bash
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# 상태 확인
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a status
```

### 2-5. 확인
AWS 콘솔 → CloudWatch → 로그 그룹에서 `/lol-match/backend/app`, `/lol-match/backend/error`, `/lol-match/backend/access`가 생성되고 로그가 쌓이는지 확인.

로그가 안 보이면:
- `logs/backend` 디렉터리가 실제로 파일을 담고 있는지 (`docker-compose.yml`의 volume 마운트가 적용된 뒤 컨테이너를 재기동했는지) 확인
- 에이전트 로그: `sudo tail -f /opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log`
- IAM 역할이 인스턴스에 실제로 연결됐는지 (EC2 콘솔에서 확인)
