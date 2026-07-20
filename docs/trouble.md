# 트러블슈팅 기록

이 프로젝트를 진행하며 겪은 문제와 원인, 해결 방법을 시기/영역별로 정리한다. 크롤링 관련 상세 기록은 [`docs/solv.md`](./solv.md), 로그 구성은 [`docs/logging.md`](./logging.md)에도 별도로 있다.

## 1. 크롤링 (SOOP FA 페이지, Playwright)

### 무한스크롤이 30명 이후로 진행되지 않음

422명이 있는 페이지인데 30명만 수집되고 끝났다.

**원인**: `page.mouse.wheel(0, 3000)`은 현재 마우스 커서 위치를 기준으로 스크롤 이벤트를 발생시킨다. 커서 기본 위치(0, 0)가 실제 스크롤 가능한 목록 컨테이너 위가 아니어서 스크롤이 먹히지 않았고, 카드 개수가 안 늘어나니 "더 이상 로드할 데이터 없음"으로 오판하고 루프가 바로 종료됐다.

**해결**: 마우스 위치에 의존하는 `mouse.wheel()` 대신, 현재 로드된 마지막 카드 요소를 화면에 보이게 스크롤하는 방식으로 교체. 카드 개수가 변하지 않는 것을 1회 감지 시 바로 종료하던 것을, 3회 연속 무변화일 때만 종료하도록 디바운스 추가.

```python
if cards:
    cards[-1].evaluate("el => el.scrollIntoView({block: 'end'})")
```

### 알 수 없는 포지션 class `"spt"`

30명만 수집됐을 때는 없었던 서포터 포지션이, 전체 422명을 스크래핑하니 `class="spt"`로 나타났다 (처음엔 `support`로 추측해 매핑해뒀었음).

**원인**: 표본이 적을 때(30명) 확인 못 한 실제 값을 추측으로 매핑해뒀던 것.

**해결**: `POSITION_MAP`에 `"spt": "SPT"` 추가.

### 배포 환경에서 `GET /crawl/fa/{season}` 호출 시 500 에러

로컬에서는 정상 동작했는데, 컨테이너에 배포하니 Spring Boot 스케줄러가 크롤링 API를 호출할 때마다 500 에러가 발생했다.

**원인**: 컨테이너 로그(`docker logs lol_match_crawling`) 확인 결과, `scroll_into_view_if_needed()`가 "요소가 안정적인 상태가 될 때까지" 대기하는 Playwright의 액션 체크 때문에 30초 타임아웃으로 실패하고 있었다. 헤드리스·하드웨어 가속 없는 컨테이너 환경에서는 로컬보다 렌더링이 느려 이 안정화 대기가 통과되지 못했다.

**해결**:
1. Playwright의 액션 대기를 거치지 않고 JS로 직접 `scrollIntoView` 호출.
2. 컨테이너 환경에서 Chromium 실행 시 흔히 필요한 플래그 추가 (샌드박스 권한 부족, `/dev/shm` 기본 64MB 제한으로 인한 크래시 예방):
   ```python
   browser = p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
   ```

**갱신 방식 자체의 설계 변화**: 이 문제를 겪으며 크롤링 트리거 방식도 함께 바뀌었다.
1. (최초) 사이트 접속할 때마다 DB를 갱신 → 매 요청마다 크롤링이 돌아 부하가 크고 위 500 에러가 그대로 사용자에게 노출됨
2. 관리자가 버튼을 눌러 수동 갱신 & 매일 오전 10시 정기 스케줄러로 자동 갱신 병행 → 컨테이너 환경 이슈(본 문제, 아래 networkidle 타임아웃 등)가 반복적으로 발생
3. (현재) 컨테이너/스케줄러를 아예 없애고, 관리자가 로컬 PC에서 직접 `crawler.py` → `sync_to_db.py`를 수동 실행 (`crawling/사용법.txt` 참고) → 컨테이너 환경 고유의 렌더링/리소스 제약 문제 자체를 회피

### `page.goto` networkidle 대기가 배포 환경에서 타임아웃

컨테이너 로그 확인 결과 `Page.goto`의 `wait_until="networkidle"`이 30초 타임아웃으로 실패하고 있었다.

**원인**: 이 페이지는 GA/GTM 등 백그라운드 통신이 계속 있어 네트워크가 완전히 idle해지는 시점이 오지 않을 수 있다.

**해결**: `domcontentloaded`로 빠르게 넘어간 뒤, 실제 목록 카드(`div.bjInfo_wrap`)가 나타날 때까지 명시적으로 대기하도록 교체.
```python
page.goto(url, wait_until="domcontentloaded")
page.wait_for_selector("div.bjInfo_wrap", timeout=60000)
```

### Riot API 403 오류

랭크 조회가 항상 실패했다.

**원인**: Cloudflare가 `urllib` 기본 User-Agent(`Python-urllib/x.y`)를 차단.

**해결**: 요청 헤더에 `User-Agent: Mozilla/5.0` 추가. 조회 실패 로그도 `streamerId`만이 아니라 실제 조회한 `lolId#lolTag`를 함께 출력하도록 개선.

## 2. 백엔드 (Spring Boot)

### Jackson 3 ObjectMapper 빈 주입 실패

웹소켓 핸들러 기동이 실패했다.

**원인**: Spring Boot 4.1은 `spring-boot-starter-jackson`으로 `tools.jackson.databind.ObjectMapper` 빈만 자동 구성하고, `com.fasterxml.jackson.databind.ObjectMapper` 빈은 만들지 않는다.

**해결**: `TeamRankingWebSocketHandler`의 import를 `tools.jackson.databind.ObjectMapper`로 교체.

### 병합 충돌 해결 중 `List` import 누락

`main` 병합(83e1fe5) 중 `ScoreRepository.java`의 `java.util.List` import가 누락되어 CI 컴파일이 실패했다.

**해결**: import 복구.

### 랭크 미조회 스트리머가 "undefined"로 표시

프론트에서 랭크를 조회하지 못한 스트리머가 `undefined`로 노출되던 것을 "언랭"으로 수정.

### 대결 전적 입력 시 이전 기록이 사라짐

`Team.setVsRecord`가 상대별 매치 결과를 기록할 때마다 기존 vs_records 엔트리를 **덮어써서** 이전 승/패 기록이 사라지던 문제.

**해결**: 새 승/패를 기존 엔트리에 **누적**하도록 수정. 관리자가 잘못 입력한 기록을 고치는 경우(수동 SQL)는 기존처럼 엔트리를 직접 교체/삭제하는 것이 맞으므로 그대로 둠.

## 3. 보안

### 삭제 API 미보호 + 레이트리밋 우회 취약점

`DELETE /api/streamers/*`, `/api/teams/*`에 인증이 없었고, `RiotController`가 클라이언트가 보낸 `X-Forwarded-For`를 그대로 신뢰해 레이트리밋을 우회할 수 있는 취약점이 있었다.

**해결**:
- `X-Admin-Key` 헤더를 요구하는 `AdminAuthFilter` 추가 (키 미설정 시 fail-closed)
- `server.forward-headers-strategy=native`로 Caddy 뒤에서 실제 클라이언트 IP를 신뢰성 있게 복원하고, 컨트롤러가 클라이언트가 직접 보낸 헤더를 신뢰하던 부분 제거
- `RiotController` 예외 메시지 원문 노출 제거
- 프론트에 `AdminKeyModal` 추가, 기존 `window.confirm`/`prompt` 흐름 대체

## 4. 인프라/배포

### CORS 차단

EC2에서 프론트에 접속했을 때 CORS 에러 발생.

**원인**: `app.cors.allowed-origins`에 EC2 origin이 없었음.

**해결**: 허용 목록에 EC2 주소 추가.

### `docker-compose.yml`의 `env_file` 오동작

**원인**: `env_file`은 자체적으로 엄격한 파서를 사용해 값이 의도대로 안 들어가는 경우가 있었다.

**해결**: `env_file` 대신 `environment:` + `${VAR}` 보간 방식으로 교체해 Compose가 `.env`를 직접 읽어 안정적으로 치환하도록 변경.

### 컨테이너 재생성 시 로그 유실

컨테이너를 재생성/재배포할 때마다 로그가 사라져 장애 원인 추적이 어려웠다.

**해결**: 호스트에 `./logs/backend` 볼륨 마운트로 로그 영속화, CloudWatch Agent 설정 추가 및 SSH 없이 로그 확인하는 방법 문서화 (`docs/logging.md`).

### AWS 배포 크롤링 → 로컬 실행 전환

크롤링을 AWS 배포 서비스(스케줄러)로 운영하던 방식이 배포 환경 디버깅 난이도·비용 문제로 계속 발목을 잡았다.

**해결**: 크롤링을 로컬 스크립트 방식으로 전환하고, 시간 스케줄러 대신 수동 버튼으로 트리거하도록 변경. AWS 의존성 제거.

## 5. 참고: 진행 중/보류된 이슈

- **"멸망전" 커스텀 등급 시스템(`scores` 테이블)**: 등급 기준(점수↔등급 매핑, ±1~3점 재량 조정 방식)과 스트리머 목록이 확정되지 않아 구현 보류 중.
