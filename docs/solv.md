# 크롤링 트러블슈팅 기록

SOOP FA 페이지(`crawling/crawler.py`) 크롤링 기능을 실제 배포 환경에 붙이는 과정에서 발생한 문제와 해결 방법을 기록한다.

## 문제 1: 무한스크롤이 30명 이후로 진행되지 않음

422명이 있는 페이지인데 30명만 수집되고 끝났다.

**원인**: `page.mouse.wheel(0, 3000)`은 현재 마우스 커서 위치를 기준으로 스크롤 이벤트를 발생시킨다. 커서 기본 위치(0, 0)가 실제 스크롤 가능한 목록 컨테이너 위가 아니어서 스크롤이 먹히지 않았고, 카드 개수가 안 늘어나니 "더 이상 로드할 데이터 없음"으로 오판하고 루프가 바로 종료됐다.

**해결**: 마우스 위치에 의존하는 `mouse.wheel()` 대신, 현재 로드된 마지막 카드 요소를 화면에 보이게 스크롤하는 방식으로 교체. 또한 카드 개수가 변하지 않는 것을 1회 감지 시 바로 종료하던 것을, 3회 연속 무변화일 때만 종료하도록 디바운스를 추가해 느린 로딩에도 안정적으로 동작하게 했다.

```python
if cards:
    cards[-1].evaluate("el => el.scrollIntoView({block: 'end'})")
```

## 문제 2: 알 수 없는 포지션 class "spt"

30명만 수집됐을 때는 없었던 서포터 포지션이, 전체 422명을 스크래핑하니 `class="spt"`로 나타났다 (처음엔 `support`로 추측하고 매핑해뒀었음).

**원인**: 표본이 적을 때(30명) 확인 못 한 실제 값을 추측으로 매핑해뒀던 것.

**해결**: `POSITION_MAP`에 `"spt": "SPT"` 추가.

## 문제 3: 배포 환경에서 `GET /crawl/fa/{season}` 호출 시 500 에러

로컬에서는 정상 동작했는데, AWS EC2 컨테이너에 배포하니 Spring Boot의 스케줄러가 크롤링 API를 호출할 때마다 500 에러가 발생했다.

**원인**: 컨테이너 로그(`docker logs lol_match_crawling`) 확인 결과, `scroll_into_view_if_needed()`가 "요소가 안정적인 상태가 될 때까지" 대기하는 Playwright의 액션 체크 때문에 30초 타임아웃으로 실패하고 있었다. 헤드리스·하드웨어 가속 없는 컨테이너 환경에서는 로컬보다 렌더링이 느려 이 안정화 대기가 통과되지 못했다.

**해결**:
1. Playwright의 액션 대기(`scroll_into_view_if_needed`)를 거치지 않고, JS로 직접 `scrollIntoView`를 호출하도록 변경:
   ```python
   cards[-1].evaluate("el => el.scrollIntoView({block: 'end'})")
   ```
2. 컨테이너 환경에서 Chromium 실행 시 흔히 필요한 플래그도 함께 추가 (샌드박스 권한 부족, `/dev/shm` 기본 64MB 제한으로 인한 크래시 예방):
   ```python
   browser = p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
   ```

수정 후 로컬 재현 테스트에서 422명 전체 정상 수집을 재확인했다.
