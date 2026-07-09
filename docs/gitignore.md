# .gitignore 정리

이 저장소에는 `.gitignore`가 3곳에 있습니다. 각각 무엇을 왜 제외하는지, 그리고 **새로 클론했을 때 git에는 없지만 직접 만들어야 실행되는 파일**이 무엇인지 정리합니다.

```
lol_match/.gitignore                    # 루트 - 안전망
frontend/.gitignore                     # React + Vite 프론트엔드
matching/matching/.gitignore            # Spring Boot 백엔드 (실제 Gradle 프로젝트 루트)
```

## 1. 루트 `.gitignore`

frontend/matching이 각자 gitignore를 갖고 있어 대부분은 거기서 걸러지지만, 루트에서 실수로 생성되는 파일(예: 루트에서 `npm install`을 잘못 실행했거나, 에디터가 루트에 설정 폴더를 만드는 경우)까지 막기 위한 안전망입니다.

| 항목 | 이유 |
|---|---|
| `.env`, `.env.*.local` (단 `.env.example`은 예외) | 비밀값 유출 방지 |
| `.DS_Store`, `Thumbs.db`, `desktop.ini` | macOS/Windows가 자동 생성하는 OS 메타파일 |
| `.vscode/*`(단 `extensions.json` 제외), `.idea/`, `*.iml` | 개인 에디터/IDE 설정 |
| `*.log`, `logs/` | 실행 로그 |
| `node_modules/` | 루트에서 실수로 설치된 경우 대비 |
| `*.tmp`, `*.bak` | 임시/백업 파일 |

## 2. `frontend/.gitignore` (React + Vite + TS)

| 항목 | 이유 |
|---|---|
| `node_modules` | `npm install`로 복원 가능한 의존성 (용량 큼) |
| `dist`, `dist-ssr` | `npm run build` 산출물 |
| `.env`, `.env.local`, `.env.*.local`, `.env.development`, `.env.production` | API 서버 주소 등 환경별 설정값 |
| `*.tsbuildinfo`, `.vite`, `.cache` | TypeScript/Vite가 생성하는 빌드 캐시 |
| `coverage`, `*.lcov` | 테스트 커버리지 리포트(현재는 테스트 미도입, 추가 시 대비) |
| `logs`, `*.log`, `npm-debug.log*` 등 | 패키지 매니저/런타임 로그 |
| `.vscode/*`(단 `extensions.json` 제외), `.idea`, `*.suo` 등 | 에디터/IDE 설정 |
| `.DS_Store`, `Thumbs.db` | OS 메타파일 |

### 새로 클론했을 때 직접 만들어야 하는 것
- **`node_modules/`**: `cd frontend && npm install`로 생성
- **`.env`** *(선택)*: `VITE_API_BASE_URL`을 기본값(`http://localhost:8080`)과 다르게 쓸 때만 필요.
  ```
  VITE_API_BASE_URL=http://localhost:8080
  ```
  현재 저장소에는 `.env.example`이 없습니다 — 팀원이 이 값을 알아야 한다면 하나 만들어 커밋해두는 걸 권장합니다.

## 3. `matching/matching/.gitignore` (Spring Boot + Gradle)

| 항목 | 이유 |
|---|---|
| `.env`, `.env.local`, `.env.*.local`(단 `.env.example` 예외) | **DB 비밀번호, `RIOT_API_KEY` 등 실제 비밀값** — 가장 중요 |
| `.gradle`, `build/`, `bin/`, `out/` | Gradle/IDE 빌드 산출물 (재빌드로 복원 가능) |
| `*.log`, `logs/` | 애플리케이션 로그 |
| `.idea`, `*.iml`, `.vscode/` 등 | IntelliJ/VS Code 설정 |
| `.classpath`, `.project`, `.settings` 등(STS/Eclipse) | Eclipse 계열 IDE 메타파일 |
| `.DS_Store`, `Thumbs.db` | OS 메타파일 |

### 새로 클론했을 때 직접 만들어야 하는 것
- **`.env`** *(필수)*: `.env.example`을 복사해서 실제 값을 채워야 서버가 기동됩니다.
  ```
  DB_URL=jdbc:postgresql://localhost:5432/lol_match
  DB_USERNAME=
  DB_PASSWORD=
  RIOT_API_KEY=
  ```
  - `DB_URL`/`DB_USERNAME`/`DB_PASSWORD`: 로컬 PostgreSQL 접속 정보 (`docs/server_db.md` 참고)
  - `RIOT_API_KEY`: [Riot Developer Portal](https://developer.riotgames.com/)에서 발급받은 키. 개발용 키는 24시간마다 만료되니 재발급 필요.
- **`.gradle/`, `build/`**: `./gradlew build` 또는 IDE 실행 시 자동 생성
- **`.idea/`**: IntelliJ로 프로젝트를 열면 자동 생성

## 4. 요약 — 클론 직후 체크리스트

1. `matching/matching/.env.example`을 복사해 `matching/matching/.env` 생성 → DB 접속정보 + Riot API 키 채우기
2. PostgreSQL에 `lol_match` 데이터베이스 준비 (`docs/server_db.md` 참고)
3. (선택) `frontend/.env`에 `VITE_API_BASE_URL` 지정 — 기본값(`localhost:8080`) 그대로 쓰면 생략 가능
4. `cd frontend && npm install`
5. `cd matching/matching && ./gradlew bootRun` (또는 IDE에서 실행)

> ⚠️ `.env` 파일은 git에 올라가지 않으므로, 이 값들은 **팀 내부 채널(예: 1:1 공유, 사내 시크릿 매니저 등)로 별도 전달**해야 합니다. `.env.example`에는 절대 실제 값을 채우지 마세요.
