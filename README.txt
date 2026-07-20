========================================
 2026 LoL 멸망전 with Gen.G 팀 구성 웹사이트
========================================

프로젝트 개요
------------
SOOP(구 아프리카TV) 소속 스트리머들이 참여하는 "LoL 멸망전" 이벤트를 위한 웹 서비스.
스트리머 롤 티어 데이터베이스 조회, 팀 구성(드래그앤드롭), 대결 전적 확인,
실시간 응원 순위 기능을 제공한다.


기술 스택
------------

[Backend]  matching/matching
- Java 21
- Spring Boot 4.1.0
  - spring-boot-starter-data-jpa
  - spring-boot-starter-security
  - spring-boot-starter-validation
  - spring-boot-starter-webmvc
  - spring-boot-starter-websocket (실시간 팀 응원 순위)
- PostgreSQL (postgresql JDBC 드라이버)
- Lombok
- logstash-logback-encoder (JSON 구조화 로그)
- springboot4-dotenv (.env 로딩)
- JUnit 5 (테스트)

[Frontend]  frontend
- React 19 + TypeScript
- Vite 8 (빌드/개발 서버)
- React Router 7
- @dnd-kit (팀 구성 드래그앤드롭)
- html-to-image (구성된 팀 카드 이미지 캡처/공유)
- oxlint (린트)

[Crawling]  crawling
- Python
- Playwright (SOOP FA 페이지 크롤링용 헤드리스 브라우저)
- BeautifulSoup4 (HTML 파싱)
- SQLAlchemy + psycopg2-binary (DB 동기화)
- Pydantic, python-dotenv
- 배포 서비스가 아닌 로컬 수동 실행 스크립트 (crawler.py → sync_to_db.py)

[Infra / 배포]
- Docker + Docker Compose (backend / frontend / caddy 3개 컨테이너)
- Caddy 2 (리버스 프록시, HTTPS 자동 발급, leole-match.site 도메인)
- Docker Hub 이미지 배포 (wookhyunkim/lol_match_backend, lol_match_frontend)
- AWS CloudWatch Logs (선택적 로그 수집; 기본은 호스트 볼륨 마운트)

[외부 API]
- Riot Games API (솔로랭크 티어 조회)


시스템 아키텍처
------------

                        HTTPS (leole-match.site)
                                │
                          ┌─────▼─────┐
                          │   Caddy    │  reverse proxy + TLS
                          └─┬───────┬─┘
                    /api/*  │       │  그 외 경로
                            ▼       ▼
                    ┌───────────┐ ┌────────────┐
                    │  backend  │ │  frontend  │
                    │ (Spring   │ │ (React,    │
                    │  Boot)    │ │  정적 빌드) │
                    └─┬───────┬─┘ └────────────┘
                      │       │
        WebSocket ◄───┘       └──► REST API
   (실시간 응원 순위)                 │
                                      ▼
                              ┌──────────────┐
                              │ PostgreSQL   │
                              │ streamers /  │
                              │ tiers /      │
                              │ teams /      │
                              │ vs_records / │
                              │ team_cheer / │
                              │ visit_counter│
                              └──────────────┘

  backend ──► Riot Games API   (스트리머 솔로랭크 조회)

  (별도, 배포 컨테이너 밖)
  crawling/  ──►  SOOP FA 페이지 크롤링(Playwright)
              ──►  Riot API 조회
              ──►  PostgreSQL 직접 동기화 (sync_to_db.py, 로컬에서 수동 실행)


주요 도메인 (matching/matching/.../domain)
------------
- Streamer   : 스트리머 기본 정보 (이름, 롤 아이디#태그, 아이콘 등)
- Tier       : Riot API로 조회한 실제 솔로랭크 티어/디비전/LP (시즌별 이력)
- Score      : "멸망전" 자체 커스텀 등급/점수 (실제 랭크와 별개, 예정)
- Team       : 팀명, 라인업(top/jungle/mid/ad/support), 승/패
- VsRecord   : 팀 간 대결 전적 (상대 팀별 누적 승/패)
- TeamCheer  : 실시간 응원(좋아요류) 카운트 → 웹소켓으로 순위 브로드캐스트
- VisitCounter : 페이지 방문자 수 카운터


기타 참고 문서 (docs/)
------------
- 기획.md        : 초기 기획서 (기능/DB/API 설계)
- backend_flow.md, frontend_flow.md : 백엔드/프론트 코드 흐름
- logging.md     : 로그 구성 및 확인 방법
- docker.md, docker-image.md : Docker 빌드/배포 메모
- solv.md, trouble.md : 트러블슈팅 기록
