# 백엔드(matching) 코드 흐름

> Spring Boot(Java 21) 기반 REST API 서버(`matching/matching`)의 요청 처리 흐름 문서입니다.
> 레이어 구조: `Controller → Service(@Transactional) → Repository(Spring Data JPA) → PostgreSQL`,
> 외부 연동: Riot Games API(`RestClient`), WebSocket(팀 응원 실시간 순위).

## 1. 요청이 들어오는 경로 (공통 파이프라인)

```
HTTP 요청
 └─ SecurityConfig.securityFilterChain
     ├─ CorsConfig의 CorsConfigurationSource 적용
     │    (app.cors.allowed-origins: localhost:5173/5174, EC2 origin, leole-match.site(+www) — /api/** 전체)
     ├─ CSRF/HTTP Basic/폼 로그인 비활성화
     └─ anyRequest().permitAll()  ※ SOOP OAuth 연동 전까지 전체 공개 (SecurityConfig.java 주석 참고)
 └─ AdminAuthFilter (OncePerRequestFilter, Security 필터체인과 별개로 등록)
     └─ DELETE /api/streamers/*, /api/teams/*  또는 POST /api/teams/match-results 인 경우만
        X-Admin-Key 헤더를 상수 시간 비교(MessageDigest.isEqual)로 검증, 불일치/키 미설정 시 403
 └─ @RestController 매핑
     └─ @Valid로 요청 DTO 검증 (실패 시 MethodArgumentNotValidException)
 └─ Service 메서드 호출 (읽기는 클래스 레벨 @Transactional(readOnly = true),
                          쓰기 메서드만 개별적으로 @Transactional 재선언)
 └─ Repository(JPA)로 DB 접근
 └─ 예외 발생 시 GlobalExceptionHandler(@RestControllerAdvice)가 가로채서
    { timestamp, status, message } 형태의 JSON으로 통일 응답
```

### 커스텀 예외 → HTTP 상태 매핑

| 예외 | 상태 코드 |
|---|---|
| `StreamerNotFoundException` | 404 |
| `TeamNotFoundException` | 404 |
| `InvalidLineupException` | 409 |
| `RiotAccountNotFoundException` | 404 |
| `RiotRankedDataNotFoundException` | 422 |
| `DuplicateStreamerException` | 409 |
| `MethodArgumentNotValidException` (`@Valid` 실패) | 400 |
| `AdminAuthFilter` 검증 실패 | 403 (예외가 아니라 필터에서 직접 응답) |

## 2. 엔드포인트 목록

| 메서드 | 경로 | 컨트롤러 | 관리자 키 필요 | 설명 |
|---|---|---|---|---|
| POST | `/api/streamers` | StreamerController | | 스트리머 등록 (Riot 티어 자동 조회 포함) |
| GET | `/api/streamers` | StreamerController | | 목록 조회 (`tier`/`line`/`groupBy` 쿼리) |
| GET | `/api/streamers/{seq}` | StreamerController | | 단건 조회 |
| DELETE | `/api/streamers/{seq}` | StreamerController | ✅ | 삭제 (Tier/Score 함께 삭제) |
| POST | `/api/teams` | TeamController | | 팀 생성 |
| GET | `/api/teams` | TeamController | | 팀 목록(최근 생성순) |
| GET | `/api/teams/validate-lineup` | TeamController | | 라인 일치 여부만 검증(저장 없이, 현재 프론트 미사용) |
| GET | `/api/teams/{seq}` | TeamController | | 팀 단건 조회 |
| PATCH | `/api/teams/{seq}` | TeamController | | 라인업 수정 |
| DELETE | `/api/teams/{seq}` | TeamController | ✅ | 팀 삭제 |
| POST | `/api/teams/match-results` | TeamController | ✅ | 대전 결과(승/패) 기록, 상대 팀에 대칭 기록 |
| GET | `/api/teams/cheer/me` | TeamCheerController | | 내 IP가 응원한 팀 seq 조회 |
| POST | `/api/teams/{seq}/cheer` | TeamCheerController | | 응원 등록/변경 → 갱신된 순위를 응답 + 웹소켓으로도 브로드캐스트 |
| GET | `/api/v1/riot/summoner` | RiotController | | Riot 티어 미리 조회(등록 전) + IP 레이트리밋 |
| POST | `/api/visits` | VisitController | | 방문자 수 1 증가 후 누적값 반환 |
| WS | `/api/ws/team-ranking` | TeamRankingWebSocketHandler | | 응원 순위 실시간 브로드캐스트 구독 |

## 3. 기능별 흐름

### 3-1. 스트리머 등록 — `POST /api/streamers`

```
StreamerController.register(@Valid StreamerRegisterRequest)
 └─ StreamerService.register()  [@Transactional]
     ├─ streamerRepository.existsByLolIdAndLolTag / existsByStreamerId
     │    → 이미 있으면 DuplicateStreamerException (409)
     ├─ RiotApiService.fetchAccount(lolId, lolTag)
     │    → riotAccountClient(GET https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine})
     │    → 4xx면 RiotAccountNotFoundException (404)
     ├─ RiotApiService.fetchSoloRankEntry(puuid, ...)
     │    → riotPlatformClient(GET https://kr.api.riotgames.com/lol/league/v4/entries/by-puuid/{puuid})
     │    → RANKED_SOLO_5x5 큐만 필터, 없으면(언랭) RiotRankedDataNotFoundException (422)
     ├─ SOOP 프로필 이미지 URL 조합
     │    "https://stimg.sooplive.com/LOGO/{streamerId 앞 2글자}/{streamerId}/m/{streamerId}.webp"
     └─ Streamer 저장 → Tier(등록 시점 티어 스냅샷) 저장 → StreamerResponse 반환 (score는 null)
```

두 Riot 호출 모두 `X-Riot-Token` 헤더로 `RIOT_API_KEY`(.env)를 실어 보냅니다(`RiotClientConfig`).

이 등록 경로와 별도로, `crawling/` 스크립트(로컬 수동 실행)가 SOOP FA 페이지를 크롤링해 `streamers`/`scores` 테이블을 직접 upsert합니다 — 실제 참가 스트리머 대부분은 이 크롤링 경로로 채워지며, 이 API는 개별 수동 등록/보정용입니다.

### 3-2. 스트리머 목록 조회 — `GET /api/streamers`

```
StreamerService.findAll(tierFilter, lineFilter)
 ├─ streamerRepository.findAll()
 ├─ tierRepository.findByStreamerSeqIn(...) 로 N+1 없이 한 번에 티어 배치 조회
 ├─ scoreRepository.findByStreamerSeqIn(...) 로 "멸망전" 커스텀 점수/등급도 배치 조회
 ├─ streamer + tier + score 조인 → tier/line 필터 적용 (score 필터는 프론트에서 처리)
 └─ TIER_RANK_COMPARATOR로 정렬: 티어 순위 → 디비전 → LP 내림차순

groupBy=tier|line 쿼리 파라미터가 있으면
 StreamerController.groupOrdered()가 LolTier/Line enum 선언 순서를 기준으로
 LinkedHashMap으로 재정렬해 그룹핑된 형태로 응답
```

`StreamerResponse`에는 실제 Riot 랭크(`tier`/`division`/`lp`)와 "멸망전" 커스텀 등급(`peakTier`/`score`)이 함께 내려갑니다. 각각 `tiers`/`scores` 테이블의 스트리머별 **최신** 레코드(`findFirstByStreamerSeqOrderByFetchedAtDesc`)이며, 서로 독립적으로 null일 수 있습니다.

### 3-3. 팀 생성 — `POST /api/teams`

```
TeamService.create()  [@Transactional]
 ├─ 팀장 이름(captainStreamerName)이 streamers 테이블에 존재하는지 확인
 ├─ assertLineupValid(lineup, forceLineMismatch)
 │    ├─ 같은 스트리머가 두 라인 이상에 중복 배치되면 InvalidLineupException
 │    └─ forceLineMismatch=false인데 streamer.line != 배치된 라인이면 InvalidLineupException
 │       (프론트는 항상 forceLineMismatch=true로 보내므로 실제로는 이 분기가 거의 안 탐 — 라인 검증은
 │        프론트 TeamBuildPage의 드래그앤드롭 단계에서 이미 사용자 확인을 받음)
 └─ Team 저장 (lineup은 Map<Line,String> 그대로 jsonb 컬럼(teams.lineup)에 저장)
```

`GET /api/teams/validate-lineup`은 저장 없이 라인 일치 여부만 확인하는 별도 엔드포인트지만, 현재 프론트 코드에서는 호출하지 않습니다(팀 생성 시 클라이언트 판단 + `forceLineMismatch: true`로 대체).

점수 상한(182점)·어드밴티지 할인 계산은 서버가 아니라 **프론트에서만** 검증됩니다(`TeamBuildPage`, `utils/advantage.ts`) — 서버는 라인업 구조만 검증하고 점수 총합은 신경 쓰지 않습니다.

### 3-4. 팀 삭제 / 응원(cheer) / 방문자 카운터

```
DELETE /api/teams/{seq}                    # AdminAuthFilter 통과 필요, TeamService.delete()

GET  /api/teams/cheer/me                   # TeamCheerService.getMyVote(remoteAddr)
                                            #   team_cheer 테이블(PK=IP)에서 이전에 투표한 팀 seq 조회
POST /api/teams/{seq}/cheer                # TeamCheerService.vote(seq, remoteAddr)
                                            #   teamCheerRepository.upsertVote(ip, teamSeq)로 IP당 1행만 유지
                                            #   (같은 IP가 다시 호출하면 투표 대상만 갱신, 중복 집계 안 됨)
                                            #   → visible=true인 팀만 대상으로 순위 재계산 후 반환
                                            #   → TeamRankingWebSocketHandler.broadcast()로
                                            #     "/api/ws/team-ranking" 구독자 전체에 즉시 전파

POST /api/visits                           # VisitService.incrementAndGet() — 단일 카운터 증가 후 값 반환
```

응원 순위는 팀장 인증이나 관리자 키 없이 누구나 호출 가능한 공개 API입니다(IP당 1표로만 제한).

### 3-5. 대전 결과 기록 — `POST /api/teams/match-results`

```
TeamService.recordMatchResult()  [@Transactional, AdminAuthFilter 통과 필요]
 ├─ teamName / opponentTeamName 각각 teamRepository.findByTeamName()으로 조회
 ├─ team.setVsRecord(opponent, wins, losses)       # 상대별 전적을 vs_records(jsonb) 배열에 누적 upsert
 ├─ opponent.setVsRecord(team, losses, wins)        # 상대 팀에는 승패를 뒤집어 대칭 기록
 └─ 두 팀 모두 wins/losses 합계를 vsRecords 배열에서 재계산
```

별도의 `matches` 테이블은 없고, 각 팀 엔티티의 `vs_records` jsonb 배열이 곧 전적 데이터입니다. 프론트 `MatchRecordPage`는 이 `vsRecords`를 팀 쌍으로 재구성해 화면에 표시합니다.

같은 상대에 대해 다시 기록을 입력하면 **덮어쓰지 않고 기존 승/패에 누적**됩니다(한 세션 = 여러 매치를 대표하는 값이 아니라, 반복 입력 시 계속 쌓이는 값). 상세 배경은 [`trouble.md`](trouble.md) 참고.

### 3-6. Riot 티어 미리 조회 — `GET /api/v1/riot/summoner`

```
RiotController.getSummoner()
 ├─ 요청 IP(server.forward-headers-strategy=native로 Caddy의 X-Forwarded-For를 검증해 복원된 값) 추출
 ├─ RateLimiterService.isAllowed("riot:" + ip)
 │    → 인메모리 고정 윈도우(분당 10회, 인스턴스 로컬)
 │    → 초과 시 429 Too Many Requests
 └─ RiotApiService.getSummonerInfo(gameName, tagLine)
      └─ 등록 흐름과 달리 언랭을 에러로 취급하지 않고 tier="언랭"으로 응답 (단순 미리보기용)
      └─ 예외 발생 시 502 Bad Gateway
```

`RateLimiterService`는 다중 인스턴스로 스케일아웃하면 인스턴스별로 카운트가 분리되는 한계가 코드 주석으로 명시되어 있습니다(분산 환경 전환 시 Redis 등 필요).

## 4. 데이터 모델 (JPA 엔티티)

- `Streamer` (`streamers` 테이블): 이름, SOOP 계정 ID(unique), 아이콘 URL, 롤 아이디/태그, 라인(enum), SOOP 채널 ID
- `Tier` (`tiers` 테이블): `streamerSeq` FK 성격의 컬럼(연관관계 매핑 없이 Long으로만 보유), 실제 Riot 솔로랭크 티어/디비전/LP/시즌/조회시각. `findFirstByStreamerSeqOrderByFetchedAtDesc`로 최신 값을 조회
- `Score` (`scores` 테이블): "멸망전" 자체 커스텀 등급/점수. `peakTier`(등급 문자열), `score`(BigDecimal, 0.5 단위 가능), `scoreAdjustment`(재량 조정폭), `line`, `season`. 크롤링 동기화(`updateFromCrawl`)로 갱신되며 Tier와 동일하게 시즌별 이력을 쌓음
- `Team` (`teams` 테이블): 팀명, 팀장 이름, `lineup`(`Map<Line,String>`, jsonb), 승/패 합계, `vsRecords`(`List<VsRecord>`, jsonb), `visible`(비공개 처리 플래그)
- `TeamCheer` (팀 응원): IP별 투표 대상 팀, 팀별 누적 응원 수 집계에 사용
- `VisitCounter`: 전체 페이지 방문자 수 단일 카운터

`lineup`/`vsRecords`는 별도 테이블 없이 PostgreSQL `jsonb` 컬럼(`@JdbcTypeCode(SqlTypes.JSON)`)에 그대로 직렬화되어 저장됩니다.

## 5. 설정 값이 코드로 흘러가는 경로

```
matching/matching/.env  (DB_URL, DB_USERNAME, DB_PASSWORD, RIOT_API_KEY, ADMIN_API_KEY)
 └─ spring-dotenv 플러그인(build.gradle: me.paulschwarz:springboot4-dotenv)이 기동 시 자동 로드
     └─ application.properties의 ${DB_URL} 등 플레이스홀더에 주입
         ├─ spring.datasource.* → JPA/Hibernate가 PostgreSQL 커넥션 생성
         ├─ riot.api-key → RiotProperties(@ConfigurationProperties) → RiotClientConfig의 RestClient 빈에 헤더로 주입
         └─ app.admin-api-key → AdminAuthFilter가 X-Admin-Key 헤더와 비교(미설정 시 항상 403, fail-closed)
```

`.env`는 실제 비밀값을 담고 있어 `.gitignore`로 제외되어 있으며, 값 없는 형태인 `.env.example`만 저장소에 커밋됩니다.

## 6. 프론트엔드와의 매핑

프론트 쪽 호출 지점은 [`frontend_flow.md`](frontend_flow.md)의 "6. 백엔드와의 매핑" 표 참고.
