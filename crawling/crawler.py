from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

from schemas import FaEntry

FA_PAGE_URL = "https://bjmatchfa.sooplive.com/fa/{season}"

POSITION_MAP = {
    "top": "TOP",
    "jungle": "JGL",
    "mid": "MID",
    "adc": "BOT",
    "spt": "SPT",
    "support": "SPT",
}

GRADE_ORDER = [
    "Transcended", "God", "Legendary", "Unique", "SSR", "SR", "R",
    "S+", "S", "S-", "A+", "A", "A-", "B+", "B", "B-",
    "C+", "C", "C-", "D+", "D", "D-", "E+", "E", "E-", "F+", "F", "F-",
]
GRADE_MAP = {grade.lower(): grade for grade in GRADE_ORDER}


def _load_full_html(url: str) -> str:
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        page = browser.new_page()
        page.goto(url, wait_until="networkidle")

        previous_count = -1
        stable_rounds = 0
        for _ in range(100):
            cards = page.query_selector_all("div.bjInfo_wrap")
            count = len(cards)
            if count == previous_count:
                stable_rounds += 1
                if stable_rounds >= 3:
                    break
            else:
                stable_rounds = 0
            previous_count = count
            if cards:
                cards[-1].evaluate("el => el.scrollIntoView({block: 'end'})")
            page.wait_for_timeout(1500)

        html = page.content()
        browser.close()
    return html


def _parse_entry(card) -> FaEntry:
    position_i = card.select_one("span.position i")
    nick_a = card.select_one('p.nick a[href*="sooplive.com/station/"]')
    tier_dd = card.select_one("dd.tier")
    score_dd = card.select_one("dd.bjmatch_score")
    adjustment_span = card.select_one("dl.reg_score_info dd span")

    lol_a = card.select_one(
        'dd.multi_nick .multi_nick_layer ul li a[href*="lol.ps/summoner/"]'
    ) or card.select_one('div.record dd a.nick[href*="lol.ps/summoner/"]')

    position_class = position_i["class"][0]
    if position_class not in POSITION_MAP:
        raise ValueError(f"알 수 없는 포지션 class: {position_class}")

    peak_tier_raw = tier_dd.get_text(strip=True)
    if peak_tier_raw.lower() not in GRADE_MAP:
        raise ValueError(f"알 수 없는 등급: {peak_tier_raw}")

    streamer_id = nick_a["href"].rstrip("/").rsplit("/", 1)[-1]
    lol_id, lol_tag = lol_a.get_text(strip=True).split("#", 1)

    return FaEntry(
        streamer_name=nick_a.get_text(strip=True),
        streamer_id=streamer_id,
        lol_id=lol_id,
        lol_tag=lol_tag,
        peak_tier=GRADE_MAP[peak_tier_raw.lower()],
        score=float(score_dd.get_text(strip=True)),
        score_adjustment=float(adjustment_span.get_text(strip=True)) if adjustment_span else None,
        position=POSITION_MAP[position_class],
    )


def fetch_fa_list(season: str) -> list[FaEntry]:
    html = _load_full_html(FA_PAGE_URL.format(season=season))
    soup = BeautifulSoup(html, "html.parser")
    cards = soup.select("ul.bjList div.bjInfo_wrap")
    return [_parse_entry(card) for card in cards]


if __name__ == "__main__":
    import sys

    season = sys.argv[1] if len(sys.argv) > 1 else "27"
    entries = fetch_fa_list(season)
    print(f"{len(entries)}건 수집됨")
    for entry in entries:
        print(entry)
