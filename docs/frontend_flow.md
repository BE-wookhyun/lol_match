# 프론트엔드 코드 흐름

> `frontend.md`가 폴더 구조/디자인 시스템 위주라면, 이 문서는 **"클릭하면 코드가 어떤 순서로 실행되는가"** 를 페이지/기능 단위로 추적합니다.
> 기준 시점: `src/mock/*` 제거 후, 실제 백엔드(`matching`)와 REST로 통신하는 현재 코드.

## 1. 진입점

```
main.tsx
  └─ <BrowserRouter> 로 감싼 <App />

App.tsx
  ├─ <Navbar />                         # 모든 페이지 공통 상단바
  └─ <Routes>
       "/"           → TierDatabasePage
       "/team-build" → TeamBuildPage
       "/teams"      → TeamListPage
       "/matches"    → MatchRecordPage
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

"DB 등록하기" 클릭
 └─ StreamerRegisterModal 오픈
     ├─ 롤 아이디/태그 입력 후 "티어 확인" → GET /api/v1/riot/summoner
     │    (성공: 티어 미리보기 텍스트 표시 / 실패: tierCheckError 표시)
     └─ 폼 제출 → POST /api/streamers (registerStreamer)
          ├─ 성공: onRegistered → 모달 닫고 loadStreamers() 재호출(목록 새로고침)
          └─ 실패: error 상태로 폼 내부에 표시

카드 삭제 아이콘 클릭
 └─ handleDeleteStreamer → DELETE /api/streamers/{seq} → loadStreamers() 재호출
```

### `/team-build` TeamBuildPage — 팀 구성하기

```
mount
 └─ fetchStreamers() → GET /api/streamers → setStreamers

좌측 스트리머 풀
 └─ lineFilter/tierFilter + "이미 라인업에 배치된(assignedSeqs) 스트리머 제외"로
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

"팀 빌드" 버튼
 └─ openResultModal → 팀명 입력 모달(resultStep: 'name')
     └─ "확인" → resultStep: 'result'
         └─ canBuild(팀명+팀장+5라인 모두 채움) 여부에 따라 문구 분기
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

render
 └─ 팀별 카드: 승/패/승률(team.winRate) 표시
 └─ team.lineup( Line → streamerName 문자열 맵 )을
    utils/lineup.ts의 toLineupSeqs()로 Line → seq 맵으로 변환
    → LineupTable(읽기전용)에 넘겨 스트리머 카드 렌더
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
```

## 3. 공용 유틸/컴포넌트가 흐름에 끼는 지점

- `utils/lineup.ts`
  - `resolveStreamerByName`: 이름 문자열 → `Streamer` 객체 역참조(팀장 매칭 등)
  - `toLineupSeqs`: 서버가 내려주는 `Line → streamerName` 형태의 lineup을 화면(`LineupTable`)이 기대하는 `Line → seq` 형태로 변환. `TeamListPage`, `MatchRecordPage`에서 공통 사용.
- `components/LineupTable.tsx`: `editable` prop 하나로 팀 구성 페이지(드롭 가능 + 삭제 버튼)와 조회 전용 페이지(팀 목록/대결 기록) 양쪽에 재사용됩니다.
- `components/Modal.tsx`: 오버레이만 제공하는 얇은 컴포넌트. 라인 불일치 경고, 팀명 입력, 빌드 결과 안내 세 곳에서 서로 다른 내용으로 재사용.

## 4. 에러 처리 패턴

모든 `api/*.ts` 함수는 동일한 패턴을 따릅니다.

```
res = await fetch(...)
if (!res.ok) throw new Error(서버가 준 message 또는 기본 문구 + 상태코드)
return res.json()
```

페이지 컴포넌트는 `.catch((err: Error) => setError(err.message))` 형태로 받아 상태에 저장하고, 화면에 `{error && <p>{error}</p>}`로 노출합니다. 별도의 전역 에러 바운더리나 토스트는 없습니다.

## 5. 백엔드와의 매핑 (요약)

| 프론트 함수 | HTTP | 백엔드 엔드포인트 |
|---|---|---|
| `fetchStreamers` | GET | `/api/streamers` |
| `registerStreamer` | POST | `/api/streamers` |
| `deleteStreamer` | DELETE | `/api/streamers/{seq}` |
| `fetchSummonerTierPreview` | GET | `/api/v1/riot/summoner` |
| `createTeam` | POST | `/api/teams` |
| `fetchTeams` | GET | `/api/teams` |
| `recordTeamMatchResult` | POST | `/api/teams/match-results` |

자세한 서버 쪽 처리 흐름은 [`matching_flow.md`](matching_flow.md) 참고.
