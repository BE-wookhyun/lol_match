# 백엔드(matching) 코드 흐름

> Spring Boot(Java 21) 기반 REST API 서버(`matching/matching`)의 요청 처리 흐름 문서입니다.
> 레이어 구조: `Controller → Service(@Transactional) → Repository(Spring Data JPA) → PostgreSQL`,
> 외부 연동: Riot Games API(`RestClient`).

## 1. 요청이 들어오는 경로 (공통 파이프라인)

```
HTTP 요청
 └─ SecurityConfig.securityFilterChain
     ├─ CorsConfig의 CorsConfigurationSource 적용
     │    (app.cors.allowed-origins = http://localhost:5173,5174 만 허용, /api/** 전체)
     ├─ CSRF/HTTP Basic/폼 로그인 비활성화
     └─ anyRequest().permitAll()  ※ SOOP OAuth 연동 전까지 전체 공개 (SecurityConfig.java 주석 참고)
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

## 2. 엔드포인트 목록

| 메서드 | 경로 | 컨트롤러 | 설명 |
|---|---|---|---|
| POST | `/api/streamers` | StreamerController | 스트리머 등록 (Riot 티어 자동 조회 포함) |
| GET | `/api/streamers` | StreamerController | 목록 조회 (`tier`/`line`/`groupBy` 쿼리) |
| GET | `/api/streamers/{seq}` | StreamerController | 단건 조회 |
| DELETE | `/api/streamers/{seq}` | StreamerController | 삭제 |
| POST | `/api/teams` | TeamController | 팀 생성 |
| GET | `/api/teams` | TeamController | 팀 목록(최근 생성순) |
| GET | `/api/teams/{seq}` | TeamController | 팀 단건 조회 |
| PATCH | `/api/teams/{seq}` | TeamController | 라인업 수정 |
| GET | `/api/teams/validate-lineup` | TeamController | 라인 일치 여부만 검증(저장 없이) |
| POST | `/api/teams/match-results` | TeamController | 대전 결과(승/패) 기록 |
| GET | `/api/v1/riot/summoner` | RiotController | Riot 티어 미리 조회(등록 전) + Rate limit |

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
     └─ Streamer 저장 → Tier(등록 시점 티어 스냅샷) 저장 → StreamerResponse 반환
```

두 Riot 호출 모두 `X-Riot-Token` 헤더로 `RIOT_API_KEY`(.env)를 실어 보냅니다(`RiotClientConfig`).

### 3-2. 스트리머 목록 조회 — `GET /api/streamers`

```
StreamerService.findAll(tierFilter, lineFilter)
 ├─ streamerRepository.findAll()
 ├─ tierRepository.findByStreamerSeqIn(...) 로 N+1 없이 한 번에 티어 배치 조회
 ├─ streamer + tier 조인 → tier/line 필터 적용
 └─ TIER_RANK_COMPARATOR로 정렬: 티어 순위 → 디비전 → LP 내림차순

groupBy=tier|line 쿼리 파라미터가 있으면
 StreamerController.groupOrdered()가 LolTier/Line enum 선언 순서를 기준으로
 LinkedHashMap으로 재정렬해 그룹핑된 형태로 응답
```

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

### 3-4. 대전 결과 기록 — `POST /api/teams/match-results`

```
TeamService.recordMatchResult()  [@Transactional]
 ├─ teamName / opponentTeamName 각각 teamRepository.findByTeamName()으로 조회
 ├─ team.setVsRecord(opponent, wins, losses)       # 상대별 전적을 vs_records(jsonb) 배열에 upsert
 ├─ opponent.setVsRecord(team, losses, wins)        # 상대 팀에는 승패를 뒤집어 대칭 기록
 └─ 두 팀 모두 wins/losses 합계를 vsRecords 배열에서 재계산
```

별도의 `matches` 테이블은 없고, 각 팀 엔티티의 `vs_records` jsonb 배열이 곧 전적 데이터입니다. 프론트 `MatchRecordPage`는 이 `vsRecords`를 팀 쌍으로 재구성해 화면에 표시합니다.

### 3-5. Riot 티어 미리 조회 — `GET /api/v1/riot/summoner`

```
RiotController.getSummoner()
 ├─ 요청 IP(X-Forwarded-For 우선, 없으면 getRemoteAddr()) 추출
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
- `Tier` (`tiers` 테이블): `streamerSeq` FK 성격의 컬럼(연관관계 매핑 없이 Long으로만 보유), 티어/디비전/LP/시즌/조회시각. 스트리머 등록 시점의 스냅샷이며, `findFirstByStreamerSeqOrderByFetchedAtDesc`로 최신 값을 조회
- `Team` (`teams` 테이블): 팀명, 팀장 이름, `lineup`(`Map<Line,String>`, jsonb), 승/패 합계, `vsRecords`(`List<VsRecord>`, jsonb)

`lineup`/`vsRecords`는 별도 테이블 없이 PostgreSQL `jsonb` 컬럼(`@JdbcTypeCode(SqlTypes.JSON)`)에 그대로 직렬화되어 저장됩니다.

## 5. 설정 값이 코드로 흘러가는 경로

```
matching/matching/.env  (DB_URL, DB_USERNAME, DB_PASSWORD, RIOT_API_KEY)
 └─ spring-dotenv 플러그인(build.gradle: me.paulschwarz:springboot4-dotenv)이 기동 시 자동 로드
     └─ application.properties의 ${DB_URL} 등 플레이스홀더에 주입
         ├─ spring.datasource.* → JPA/Hibernate가 PostgreSQL 커넥션 생성
         └─ riot.api-key → RiotProperties(@ConfigurationProperties) → RiotClientConfig의 RestClient 빈에 헤더로 주입
```

`.env`는 실제 비밀값을 담고 있어 `.gitignore`로 제외되어 있으며, 값 없는 형태인 `.env.example`만 저장소에 커밋됩니다.

## 6. 프론트엔드와의 매핑

프론트 쪽 호출 지점은 [`frontend_flow.md`](frontend_flow.md)의 "5. 백엔드와의 매핑" 표 참고.
