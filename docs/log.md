# 로그 수집 (matching)

> `matching/matching` 백엔드의 로그 구성 문서입니다. 설정 파일: [`logback-spring.xml`](../matching/matching/src/main/resources/logback-spring.xml)

## 1. 로그 파일 구성

`LOG_PATH`(기본값 `logs`, 컨테이너 내부 기준 `/app/logs`) 아래에 용도별로 3개 파일로 분리됩니다. 향후 ELK/Loki 같은 수집기로 옮기기 쉽도록 콘솔 출력만 사람이 읽기 쉬운 텍스트 포맷이고, 파일 로그는 전부 **JSON 한 줄(logstash-logback-encoder)** 형태입니다.

| 파일 | 내용 | 레벨 | 보관 정책 |
|---|---|---|---|
| `logs/app.log` | 전체 애플리케이션 로그 | INFO 이상 | 100MB/일 롤링, 30일 |
| `logs/error.log` | `app.log` 중 ERROR만 별도 필터링 (장애 조사용) | ERROR만 | 100MB/일 롤링, 90일 |
| `logs/access.log` | HTTP 요청 단위 액세스 로그 (`ACCESS_LOG` 전용 로거, `additivity=false`로 `app.log`에는 중복 안 남음) | INFO | 100MB/일 롤링, 30일 |

롤링된 과거 로그는 `logs/archived/`에 `.gz`로 쌓입니다.

## 2. 요청 추적 (requestId)

[`RequestLoggingFilter`](../matching/matching/src/main/java/com/demo/matching/config/RequestLoggingFilter.java)가 모든 요청마다 UUID(`requestId`)를 발급해서

- MDC에 저장 → `app.log`/`error.log`의 모든 JSON 로그 라인에 `requestId` 필드로 포함
- 응답 헤더 `X-Request-Id`로도 반환 (프론트/클라이언트가 문의할 때 이 값으로 로그 검색 가능)
- 요청 종료 시 `access.log`에 `method, URI(+querystring), 상태코드, 처리시간(ms), 클라이언트 IP`를 1줄로 기록

즉 하나의 요청에서 발생한 액세스 로그·비즈니스 로그·에러 로그를 `requestId`로 서로 연결해서 추적할 수 있습니다.

## 3. 어디서 로그를 남기나

| 위치 | 레벨 | 내용 |
|---|---|---|
| `GlobalExceptionHandler` | WARN | 도메인 예외(스트리머/팀 미존재, 라인업 검증 실패, Riot 계정/랭크 미존재, 중복 등록, `@Valid` 실패) — 클라이언트 잘못이므로 WARN |
| `GlobalExceptionHandler`의 catch-all(`Exception.class`) | ERROR | 처리되지 않은 예외 전부 — 스택트레이스 포함, 500 응답과 함께 기록 |
| `RiotApiService` | INFO/WARN | Riot 계정 조회 성공(응답시간 포함) / 4xx 실패 |
| `RequestLoggingFilter` | INFO (`ACCESS_LOG`) | 모든 HTTP 요청 1건당 1줄 |

## 4. 확인 방법

```bash
# 실시간 확인
tail -f logs/app.log

# 특정 요청 하나만 추적 (액세스 → 비즈니스 → 에러 로그 전부)
grep '<requestId>' logs/*.log

# 도커 컨테이너 안에서 실행 중이라면
docker exec -it lol_match_backend tail -f /app/logs/error.log
```

## 5. 남은 과제

- 현재는 컨테이너 내부 파일로만 쌓임 — ELK/Loki 등 수집기(Filebeat/Promtail)로 보내려면 `logs/` 디렉터리를 볼륨 마운트해서 사이드카가 읽을 수 있게 해야 함 (인프라 작업, 미착수)
- `spring.jpa.show-sql=true`는 여전히 콘솔에만 SQL을 찍고 있어 slow query 추적용 파일 로그는 아직 없음
