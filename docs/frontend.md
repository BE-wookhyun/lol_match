# 프론트엔드 구현 문서 (초기 프로토타입 시점 기록)

> ⚠️ **이 문서는 Mock 데이터 기반 UI 프로토타입 단계의 스냅샷입니다.** 현재는 실제 백엔드(Spring Boot/PostgreSQL/Riot API)와
> REST/WebSocket으로 연동되어 있고, 페이지/컴포넌트 구성도 이후 크게 확장되었습니다(팀 삭제, 실시간 응원 순위, 방문자 카운터,
> 추천 스트리머, 어드밴티지 점수 계산, 관리자 키 인증 등). **최신 코드 흐름은 [`frontend_flow.md`](frontend_flow.md)를 참고하세요.**
> 아래 내용은 폴더 구조/디자인 시스템의 초기 설계 의도를 이해하는 역사적 참고용으로만 남겨둡니다.

> `기획.md`의 화면 설계를 기반으로 구현한 프론트엔드(React + Vite + TypeScript) 문서입니다.
> 현재 단계는 **Mock 데이터 기반 UI 프로토타입**이며, 백엔드(Spring Boot/PostgreSQL/Riot API/SOOP OAuth)는 아직 연동되지 않았습니다.

## 목차
1. 기술 스택
2. 실행 방법
3. 폴더 구조
4. 라우팅 / 페이지
5. 핵심 컴포넌트
6. 데이터 모델 & Mock 데이터
7. 디자인 시스템 (색상)
8. 주요 인터랙션 로직
9. 백엔드 연동 시 변경 지점 (TODO)

---

## 1. 기술 스택

| 구분 | 선택 | 비고 |
|---|---|---|
| 빌드 도구 | Vite | `npm create vite@latest -- --template react-ts` |
| 언어/프레임워크 | React 19 + TypeScript | 기획서(React(Vite)) 기준 |
| 라우팅 | react-router-dom | 페이지 3개 (`/`, `/team-build`, `/matches`) |
| 드래그앤드롭 | @dnd-kit/core, @dnd-kit/utilities | 팀 구성 페이지의 스트리머 풀 → 라인 슬롯 배치 |
| 이미지 캡처 | html-to-image | 팀 라인업 캡처 → PNG 다운로드 |
| 스타일링 | CSS Modules + 전역 CSS 변수(`theme.css`) | 컴포넌트별 `*.module.css` |
| Mock 아바타 | DiceBear API (`api.dicebear.com`) | 실제 SOOP 프로필 이미지 연동 전 임시 대체 |

## 2. 실행 방법

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # 프로덕션 빌드
```

## 3. 폴더 구조

```
frontend/src/
├── App.tsx                 # 라우터 + Navbar 배치
├── main.tsx                # BrowserRouter 진입점
├── index.css               # 전역 리셋, theme.css import
├── styles/
│   └── theme.css           # 색상/티어/라인 CSS 변수
├── types/index.ts          # Streamer / Team / Match 등 타입
├── constants/tiers.ts      # 티어·라인 순서, 한글 라벨, 색상 변수 매핑, 랭크 포맷터
├── mock/
│   ├── avatar.ts           # DiceBear 아바타 URL 생성
│   ├── streamers.ts        # 시드 고정 난수로 생성한 스트리머 목록 (티어별 인원 분포)
│   ├── teams.ts            # 데모 팀 3개 (라인별로 유효한 라인업 자동 구성)
│   └── matches.ts          # 데모 대결 기록 3건
├── components/
│   ├── Navbar.tsx           # 상단 네비게이션 (티어DB/팀구성/대결기록)
│   ├── StreamerCard.tsx     # 아바타 카드 + 클릭/호버 상세 팝오버
│   ├── DraggableStreamerCard.tsx  # StreamerCard를 dnd-kit 드래그 소스로 래핑
│   ├── ShortcutBar.tsx      # 티어/라인 다이아몬드 바로가기 아이콘 (스크롤 이동)
│   ├── ViewToggle.tsx       # "티어별/라인별" 토글 스위치
│   ├── TierSection.tsx      # 티어 그룹 박스 (헤더 + 카드 그리드)
│   ├── LineSection.tsx      # 라인 그룹 박스 (TierSection과 CSS 공유)
│   ├── LineupTable.tsx      # TOP/JGL/MID/BOT/SPT 슬롯 테이블 (편집/읽기전용 겸용, 드롭 타겟)
│   └── Modal.tsx            # 공용 모달 오버레이 (라인 불일치 경고 / 빌드 결과에 재사용)
└── pages/
    ├── TierDatabasePage.tsx  # "/" 스트리머 티어 데이터베이스
    ├── TeamBuildPage.tsx     # "/team-build" 팀 구성하기
    └── MatchRecordPage.tsx   # "/matches" 대결 기록
```

## 4. 라우팅 / 페이지

| 경로 | 페이지 | 대응 기획서 섹션 |
|---|---|---|
| `/` | 티어 데이터베이스 | 10-1 |
| `/team-build` | 팀 구성하기 | 10-2, 10-3 |
| `/matches` | 대결 기록 | 10-4 |

### `/` 티어 데이터베이스
- `ViewToggle`로 티어별/라인별 그룹 전환
- `ShortcutBar`로 상단 다이아몬드 아이콘 클릭 시 해당 섹션(`#tier-XXX` / `#line-XXX`)으로 스무스 스크롤
- 각 섹션은 `TierSection` / `LineSection`으로 렌더링, 내부 `StreamerCard`는 클릭·호버 시 LoL ID/라인/랭크 팝오버 노출

### `/team-build` 팀 구성하기
- 좌측: 라인/티어 필터 셀렉트 + 필터링된 스트리머 풀(드래그 소스, 이미 배치된 스트리머는 풀에서 제외)
- 우측: 팀명 입력, 팀장 확인(등록된 스트리머명 입력 → 확인 시 해당 스트리머를 자신의 라인 슬롯에 자동 배치), 5라인 슬롯 테이블(드롭 타겟)
- 라인 불일치 드롭 시 `Modal`로 경고 + "그래도 등록하시겠습니까?" 재확인 후 강제 배치 가능
- 하단 "팀 빌드" 버튼 클릭 시 결과 `Modal`("구성이 가능합니다/불가능합니다") + 캡처 아이콘(구성 가능할 때만 노출) → `html-to-image`로 라인업 영역을 PNG로 캡처해 다운로드

### `/matches` 대결 기록
- 상단 "전체 / 팀명…" 필터 버튼
- 매치 카드마다 팀A vs 팀B 스코어 + 양 팀 `LineupTable`(읽기전용) 병기

## 5. 핵심 컴포넌트

- **`LineupTable`**: `editable` prop으로 팀 구성 페이지(드롭 가능·삭제 버튼)와 대결 기록 페이지(읽기전용)에 공용으로 사용됩니다. 슬롯 행은 `useDroppable({ id: 'slot-{LINE}' })`로 드롭 타겟이 됩니다.
- **`DraggableStreamerCard`**: `useDraggable({ id: 'pool-{seq}', data: { streamer } })`로 래핑, `TeamBuildPage`의 `DndContext.onDragEnd`에서 `active.data.current.streamer`와 `over.data.current.line`을 비교해 라인 일치 여부를 판단합니다.
- **`Modal`**: 오버레이 + 카드 컨테이너만 제공하는 얇은 공용 컴포넌트. 라인 불일치 경고와 팀 빌드 결과 안내 두 곳에서 각각 다른 내용으로 재사용됩니다.

## 6. 데이터 모델 & Mock 데이터

`src/types/index.ts`가 `기획.md` 8장(DB 설계)의 `streamers`/`tiers`/`teams`/`matches` 테이블을 프론트엔드 관점으로 옮긴 타입니다.

```ts
type Line = 'TOP' | 'JGL' | 'MID' | 'BOT' | 'SPT';
type TierName = 'CHALLENGER' | 'GRANDMASTER' | 'MASTER' | 'DIAMOND' | 'EMERALD' | 'GOLD' | 'SILVER' | 'BRONZE' | 'IRON';

interface Streamer {
  seq: number; streamerName: string; streamerIconUrl: string;
  lolId: string; lolTag: string; line: Line; tier: TierName;
  division?: 'I' | 'II' | 'III' | 'IV'; lp: number; isLive?: boolean;
}

type TeamLineup = Partial<Record<Line, number>>; // line -> streamer seq

interface Team { seq: number; teamName: string; captainSeq: number; lineup: TeamLineup; wins: number; losses: number; }
interface Match { seq: number; teamASeq: number; teamBSeq: number; winnerSeq: number; score: string; matchDate: string; round: number; }
```

- `mock/streamers.ts`: 시드 고정 난수(`mulberry32`)로 매 새로고침 동일한 데이터를 생성. 티어별 인원수(챌린저 3 ~ 다이아/에메랄드 8명 등)를 지정해 실제와 비슷한 분포로 구성.
- `mock/teams.ts` / `mock/matches.ts`: 화면 데모용으로 3개 팀, 3개 대결 기록을 하드코딩.
- 스트리머 닉네임은 실제 인물이 아닌 가상의 이름(번개소나기, 달빛여우 등)을 사용해 특정 인물과의 혼동을 피했습니다.

## 7. 디자인 시스템 (색상)

`src/styles/theme.css`에 CSS 변수로 정의. 참고 사이트(cnine.kr/starcraft/tier) 스크린샷의 **라이트 배경 + 블루 네비게이션 + 다채로운 배지 컬러** 톤과, 기획서 와이어프레임 티어 아이콘 색을 결합했습니다.

| 티어 | 변수 | 색상 |
|---|---|---|
| 챌린저 | `--tier-challenger` | 골드 `#f2a93c` |
| 그랜드마스터 | `--tier-grandmaster` | 레드 `#e5484d` |
| 마스터 | `--tier-master` | 퍼플 `#9b59f6` |
| 다이아 | `--tier-diamond` | 블루 `#4fa3f7` |
| 에메랄드 | `--tier-emerald` | 그린 `#2ecc91` |
| 골드 | `--tier-gold` | 옐로우골드 `#d6a400` |
| 실버 | `--tier-silver` | 그레이블루 `#8b98a8` |
| 브론즈 | `--tier-bronze` | 브라운 `#b5713c` |
| 아이언 | `--tier-iron` | 다크그레이 `#6b7280` |

라인(TOP/JGL/MID/BOT/SPT)도 각각 고유 색(`--line-color`)을 가져 카드 하단 바·슬롯 태그 색으로 사용됩니다. 네비게이션은 `--color-primary`(블루), 강조 액션(팀 빌드 버튼 등)은 `--color-accent`(레드)를 사용합니다.

## 8. 주요 인터랙션 로직

- **라인 검증**: `TeamBuildPage.handleDragEnd`에서 `streamer.line === targetLine`이면 즉시 배치, 다르면 `mismatch` 상태로 확인 모달을 띄우고 "확인" 클릭 시에만 강제 배치(`confirmMismatch`).
- **팀장 자동 배치**: 팀장 확인 시 이름이 일치하는 스트리머를 찾아 해당 스트리머의 실제 라인 슬롯에 자동으로 채웁니다(기획서 7-2-2 대응).
- **빌드 가능 여부**: 팀명 입력 + 팀장 확인 완료 + 5라인 모두 채워짐 → `canBuild = true`. 이 값에 따라 결과 모달 문구와 캡처 버튼 노출 여부가 결정됩니다.
- **캡처**: `captureRef`가 가리키는 라인업 영역을 `html-to-image`의 `toPng`으로 변환 후 `<a download>`로 트리거.

## 9. 백엔드 연동 시 변경 지점 (TODO)

현재는 전부 `src/mock/*.ts`의 정적 배열을 사용합니다. 백엔드 연동 시:

- `mock/streamers.ts` → `GET /api/streamers`(+ `tier`/`line`/`groupBy` 쿼리) 호출로 교체
- `mock/teams.ts` → `POST /api/teams`, `GET /api/teams/{seq}`, `PATCH /api/teams/{seq}` 연동. `TeamBuildPage`의 라인 불일치 강제 등록 시 `forceLineMismatch: true` 플래그 전달(기획서 9장 API 설계 참고)
- `mock/matches.ts` → `GET /api/matches`, `GET /api/matches?teamSeq=` 연동
- `streamerIconUrl`(DiceBear) → SOOP 실제 프로필 이미지 URL로 교체
- 스트리머 등록/팀장 확인 등 인증이 필요한 액션에 SOOP OAuth 연동 (기획서 Open Issues 참고, 별도 조사 필요)
