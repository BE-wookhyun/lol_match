# 프론트엔드 코드 흐름

> `frontend.md`는 초기 Mock 프로토타입 시점 기록이고, 이 문서가 **"클릭하면 코드가 어떤 순서로 실행되는가"** 를 다루는 최신 문서입니다.
> 기준 시점: 실제 백엔드(`matching`)와 REST/WebSocket으로 통신하는 현재 코드.

## 1. 진입점

```
main.tsx
  └─ <BrowserRouter> 로 감싼 <App />

App.tsx
  ├─ <Navbar />                         # 모든 페이지 공통 상단바
  ├─ <Routes>
  │    "/"           → TierDatabasePage
  │    "/team-build" → TeamBuildPage
  │    "/teams"      → TeamListPage
  │    "/matches"    → MatchRecordPage
  ├─ <Footer />                         # 모든 페이지 하단, 방문자 수 카운터
  └─ <ContactButton />                  # 모든 페이지 우측 하단 플로팅 문의 버튼
```

모든 API 호출은 `src/api/*.ts`를 거칩니다. 각 함수는 `fetch()` 래퍼로, 실패 시 서버가 내려준 `message` 필드를 읽어(`readErrorMessage`) `Error`로 던지고, 페이지 컴포넌트는 이를 `catch`해 화면에 표시합니다. `API_BASE_URL`은 `import.meta.env.VITE_API_BASE_URL` (없으면 `http://localhost:8080`).

## 2. 페이지별 흐름

### `/` TierDatabasePage — 티어 데이터베이스

```
mount
 └─ useEffect → loadStreamers() → GET /api/streamers → setStreamers
                                                        (loading/error 상태 갱신)
render
 └─ streamers를 useMemo로 tier별/line별 그룹핑(byTier / byLine)
 └─ ViewToggle 로 groupBy 상태 전환 → TierSection / LineSection 렌더
 └─ ShortcutBar 클릭 → 해당 섹션으로 스무스 스크롤(#tier-XXX / #line-XXX)
 └─ 닉네임 검색창으로 목록 내 즉시 필터링

"DB 등록하기" 클릭
 └─ StreamerRegisterModal 오픈
     ├─ 롤 아이디/태그 입력 후 "티어 확인" → GET /api/v1/riot/summoner
     │    (성공: 티어 미리보기 텍스트 표시 / 실패: tierCheckError 표시)
     └─ 폼 제출 → POST /api/streamers (registerStreamer)
          ├─ 성공: onRegistered → 모달 닫고 loadStreamers() 재호출(목록 새로고침)
          └─ 실패: error 상태로 폼 내부에 표시

카드 삭제 아이콘 클릭
 └─ handleDeleteStreamer → DELETE /api/streamers/{seq} → loadStreamers() 재호출
    ※ 백엔드 AdminAuthFilter가 X-Admin-Key를 요구하므로 실제로는 관리자 키 입력 후 호출됨
      (아래 팀 삭제와 동일하게 AdminKeyModal 패턴 사용)
```

각 스트리머 카드는 실제 Riot 랭크(tier/division/lp)와 "멸망전" 커스텀 등급/점수(peakTier/score)를 함께 표시합니다.

### `/team-build` TeamBuildPage — 팀 구성하기

```
mount
 └─ fetchStreamers() → GET /api/streamers → setStreamers

좌측 스트리머 풀
 └─ 닉네임/lineFilter/tierFilter/scoreFilter(10점 단위 버킷)
    + "이미 라인업에 배치된(assignedSeqs) 스트리머 제외"로
    pool을 useMemo 계산 → DraggableStreamerCard로 렌더(useDraggable)

팀장 확인
 └─ "확인" 클릭 → streamerName 일치하는 스트리머 탐색
     ├─ 없음: captainError 표시
     └─ 있음: setCaptain + 해당 스트리머를 자기 라인 슬롯에 자동 배치

드래그 앤 드롭 (DndContext.onDragEnd)
 └─ over(LineupTable의 useDroppable 슬롯)와 active(드래그된 카드) 정보 비교
     ├─ streamer.line === targetLine → 즉시 lineup 상태에 배치
     └─ 라인 불일치 → Modal로 경고, "확인" 클릭 시에만 confirmMismatch()로 강제 배치
        ※ 이 판단은 프론트에서만 이루어지고, 백엔드에는 별도 검증 API를 호출하지 않습니다.
          (팀 저장 시 forceLineMismatch: true를 항상 함께 보내 서버 측 라인 검증을 우회)

점수 계산 (utils/advantage.ts, MAX_TOTAL_SCORE = 182)
 └─ totalScore = 5라인 스트리머 score 합
 └─ comboAdvantage = calculateComboAdvantage(정글, 원딜, 서포터)
      정글·서포터 또는 원딜·서포터가 각각 S+ 이상이면 -5점, A- 이상이면 -3점
      (해당되는 조합 중 가장 큰 할인 1개만 적용, 중복 적용 안 됨)
 └─ adjustedTotalScore = totalScore + comboAdvantage.score
 └─ isOverScoreLimit = adjustedTotalScore > 182 → 초과 시 팀 빌드 자체가 불가(canBuild=false)

"추천 스트리머" 버튼 (utils/recommend.ts)
 └─ 남은 라인이 1개면 recommendSingleLine(): 남은 점수에 가장 가까운 후보 3명
 └─ 남은 라인이 2개 이상이면 recommendCombos(): 라인별 후보 조합의 카르테시안 곱 중
    (라인별 후보 수를 제한해 최대 20만 조합으로 상한) 목표 점수에 가장 가까운 조합 상위 5개
 └─ RecommendModal에서 선택 시 해당 스트리머(들)를 라인업에 바로 배치

"팀 빌드" 버튼
 └─ openResultModal → 팀명 입력 모달(resultStep: 'name')
     └─ "확인" → resultStep: 'result'
         └─ canBuild(팀명+팀장+5라인+점수 한도 이내) 여부에 따라 문구 분기
             └─ "확인" 클릭 시 handleConfirmResult()
                  → POST /api/teams (createTeam, lineup은 seq→streamerName으로 변환해서 전송)
                  → 성공 시 saved=true, 실패 시 saveError 표시

캡처 아이콘(📷)
 └─ captureRef가 가리키는 라인업 DOM을 html-to-image의 toPng()로 변환 → <a download> 클릭 트리거
```

### `/teams` TeamListPage — 구성된 팀 목록

```
mount
 └─ Promise.all([fetchTeams(), fetchStreamers()])   # GET /api/teams + GET /api/streamers
      → teams, streamers 상태 설정
 └─ visibleTeams = teams.filter(t => t.visible)      # 비공개(visible=false) 팀은 목록에서 제외

render
 └─ 팀별 카드: 승/패/승률(team.winRate) 표시
 └─ team.lineup( Line → streamerName 문자열 맵 )을
    utils/lineup.ts의 toLineupSeqs()로 Line → seq 맵으로 변환
    → LineupTable(읽기전용, compact)에 넘겨 스트리머 카드 렌더
 └─ 카드 더블클릭 → deleteTarget 설정 → AdminKeyModal 오픈
      → 관리자 키 입력 확인 시 DELETE /api/teams/{seq} (deleteTeam) → 목록에서 제거
 └─ 우측 TeamRankingPanel — 실시간 응원 순위 사이드 패널 (아래 3절 참고)
```

### `/matches` MatchRecordPage — 대결 기록

```
mount
 └─ Promise.all([fetchTeams(), fetchStreamers()])

buildMatches(teams)
 └─ 별도의 "매치" 데이터가 서버에 없으므로, 각 팀의 vsRecords(팀별 상대 전적 배열)를
    순회하며 (teamA, teamB) 쌍을 중복 없이 재구성 → DerivedMatch[] 생성
    (실제 DB에 matches 테이블은 없고, teams.vs_records(jsonb)에서 파생됨)

render
 └─ 팀명 필터 버튼(teamFilter)
 └─ 매치 카드: teamA vs teamB 스코어(wins:losses) + 양 팀 LineupTable(읽기전용) 병기
 └─ "전적 입력 (관리자)" 버튼 → MatchResultModal 오픈
      → 팀A/팀B/승/패 입력 + 관리자 키 확인 → POST /api/teams/match-results (recordTeamMatchResult)
      → 성공 시 fetchTeams() 재호출로 화면 갱신
```

## 3. 실시간 응원 순위 (TeamRankingPanel + WebSocket)

`TeamListPage`에 배치된 `TeamRankingPanel`은 `api/cheers.ts`를 통해 두 채널을 조합합니다.

```
mount
 └─ fetchMyCheer() → GET /api/teams/cheer/me → 내 IP가 이전에 투표한 팀 표시(라디오 버튼 체크)
 └─ connectRankingSocket(setRanking)
      → new WebSocket(`${API_BASE_URL 를 ws로 치환}/api/ws/team-ranking`)
      → 서버가 브로드캐스트하는 순위 배열을 onmessage로 그대로 setRanking
      → 연결이 끊기면 3초 후 자동 재연결

라디오 클릭 → handleCheer(seq)
 └─ 낙관적으로 myVote를 먼저 갱신
 └─ POST /api/teams/{seq}/cheer (cheerTeam) → 응답으로 온 최신 순위로 setRanking
 └─ 실패 시 myVote를 원래 값으로 롤백 + 에러 메시지 표시
```

패널 하단에는 "표본이 작아 결과가 정확하지 않을 수 있습니다" 안내 문구가 고정 표시됩니다.

## 4. 방문자 수 카운터 (Footer)

```
Footer mount
 └─ recordVisit() → POST /api/visits → 누적 방문자 수를 받아 그대로 표시
    (페이지 전환마다가 아니라 App 최초 마운트 시 1회만 호출)
```

## 5. 공용 유틸/컴포넌트가 흐름에 끼는 지점

- `utils/lineup.ts`
  - `resolveStreamerByName`: 이름 문자열 → `Streamer` 객체 역참조(팀장 매칭 등)
  - `toLineupSeqs`: 서버가 내려주는 `Line → streamerName` 형태의 lineup을 화면(`LineupTable`)이 기대하는 `Line → seq` 형태로 변환. `TeamListPage`, `MatchRecordPage`에서 공통 사용.
- `utils/advantage.ts`: 정글/원딜-서포터 등급 조합 어드밴티지 계산 (`TeamBuildPage`에서만 사용)
- `utils/recommend.ts`: 남은 점수/라인 기준 추천 스트리머(단일/조합) 계산 (`TeamBuildPage`에서만 사용)
- `components/LineupTable.tsx`: `editable`/`compact` prop으로 팀 구성 페이지(드롭 가능 + 삭제 버튼), 팀 목록(읽기전용 컴팩트), 대결 기록(읽기전용) 세 곳에 재사용됩니다.
- `components/Modal.tsx`: 오버레이만 제공하는 얇은 컴포넌트. 라인 불일치 경고, 팀명 입력, 빌드 결과 안내 등에서 서로 다른 내용으로 재사용.
- `components/AdminKeyModal.tsx`: 관리자 키(X-Admin-Key) 입력 모달. 팀 삭제(`TeamListPage`), 대전 결과 입력(`MatchResultModal` 내부)에서 공용으로 사용.
- `components/RecommendModal.tsx`: 추천 스트리머 단일 후보/조합 후보를 보여주고 선택 시 라인업에 반영.

## 6. 에러 처리 패턴

모든 `api/*.ts` 함수는 동일한 패턴을 따릅니다.

```
res = await fetch(...)
if (!res.ok) throw new Error(서버가 준 message 또는 기본 문구 + 상태코드)
return res.json()
```

페이지 컴포넌트는 `.catch((err: Error) => setError(err.message))` 형태로 받아 상태에 저장하고, 화면에 `{error && <p>{error}</p>}`로 노출합니다. 별도의 전역 에러 바운더리나 토스트는 없습니다.

## 7. 백엔드와의 매핑 (요약)

| 프론트 함수 | HTTP | 백엔드 엔드포인트 |
|---|---|---|
| `fetchStreamers` | GET | `/api/streamers` |
| `registerStreamer` | POST | `/api/streamers` |
| `deleteStreamer` | DELETE | `/api/streamers/{seq}` |
| `fetchSummonerTierPreview` | GET | `/api/v1/riot/summoner` |
| `createTeam` | POST | `/api/teams` |
| `fetchTeams` | GET | `/api/teams` |
| `deleteTeam` | DELETE | `/api/teams/{seq}` |
| `recordTeamMatchResult` | POST | `/api/teams/match-results` |
| `fetchMyCheer` | GET | `/api/teams/cheer/me` |
| `cheerTeam` | POST | `/api/teams/{seq}/cheer` |
| `connectRankingSocket` | WS | `/api/ws/team-ranking` |
| `recordVisit` | POST | `/api/visits` |

자세한 서버 쪽 처리 흐름은 [`backend_flow.md`](backend_flow.md) 참고.
