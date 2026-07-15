import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request

REGIONAL_HOST = "https://asia.api.riotgames.com"
PLATFORM_HOST = "https://kr.api.riotgames.com"
SOLO_QUEUE = "RANKED_SOLO_5x5"

# personal Riot API key limit: 20 req/1s, 100 req/2min — space out the 2 calls per streamer
REQUEST_INTERVAL_SEC = 1.2


class RiotApiError(Exception):
    pass


def _get(url: str, retry_on_429: bool = True) -> dict | list:
    req = urllib.request.Request(url, headers={"X-Riot-Token": os.environ["RIOT_API_KEY"]})
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            return json.loads(res.read())
    except urllib.error.HTTPError as e:
        if e.code == 429 and retry_on_429:
            wait = int(e.headers.get("Retry-After", "1"))
            time.sleep(wait + 0.5)
            return _get(url, retry_on_429=False)
        raise RiotApiError(f"{url} -> HTTP {e.code}") from e


def fetch_solo_rank(lol_id: str, lol_tag: str) -> dict | None:
    """Riot ID(lol_id#lol_tag)로 소환사를 조회해 솔로랭크 리그 엔트리를 반환한다. 언랭이면 None."""
    game_name = urllib.parse.quote(lol_id, safe="")
    tag_line = urllib.parse.quote(lol_tag, safe="")
    account = _get(f"{REGIONAL_HOST}/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}")
    time.sleep(REQUEST_INTERVAL_SEC)

    entries = _get(f"{PLATFORM_HOST}/lol/league/v4/entries/by-puuid/{account['puuid']}")
    time.sleep(REQUEST_INTERVAL_SEC)

    for entry in entries:
        if entry.get("queueType") == SOLO_QUEUE:
            return entry
    return None
