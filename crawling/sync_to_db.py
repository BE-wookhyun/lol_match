import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

from crawler import fetch_fa_list

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DB_URL = os.environ["DB_URL"]
DB_USERNAME = os.environ["DB_USERNAME"]
DB_PASSWORD = os.environ["DB_PASSWORD"]


def _connect():
    host_and_db = DB_URL.removeprefix("jdbc:postgresql://")
    host_port, dbname = host_and_db.split("/", 1)
    host, port = host_port.split(":")
    return psycopg2.connect(host=host, port=port, dbname=dbname, user=DB_USERNAME, password=DB_PASSWORD)


def _upsert_streamer(cur, entry) -> int:
    cur.execute("SELECT seq FROM streamers WHERE streamer_id = %s", (entry.streamer_id,))
    row = cur.fetchone()

    if row is None:
        prefix = entry.streamer_id[:2]
        icon_url = f"https://stimg.sooplive.com/LOGO/{prefix}/{entry.streamer_id}/m/{entry.streamer_id}.webp"
        cur.execute(
            """
            INSERT INTO streamers (streamer_name, streamer_id, streamer_icon_url, lol_id, lol_tag, line, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, now())
            RETURNING seq
            """,
            (entry.streamer_name, entry.streamer_id, icon_url, entry.lol_id, entry.lol_tag, entry.position),
        )
        return cur.fetchone()[0]

    streamer_seq = row[0]
    cur.execute(
        "UPDATE streamers SET streamer_name = %s, lol_id = %s, lol_tag = %s, line = %s WHERE seq = %s",
        (entry.streamer_name, entry.lol_id, entry.lol_tag, entry.position, streamer_seq),
    )
    return streamer_seq


def _upsert_score(cur, streamer_seq: int, entry, season: str) -> None:
    cur.execute(
        "SELECT seq FROM scores WHERE streamer_seq = %s AND season = %s",
        (streamer_seq, season),
    )
    row = cur.fetchone()

    if row is None:
        cur.execute(
            """
            INSERT INTO scores (streamer_seq, peak_tier, score, score_adjustment, line, season, fetched_at)
            VALUES (%s, %s, %s, %s, %s, %s, now())
            """,
            (streamer_seq, entry.peak_tier, entry.score, entry.score_adjustment, entry.position, season),
        )
        return

    cur.execute(
        "UPDATE scores SET peak_tier = %s, score = %s, score_adjustment = %s, line = %s, fetched_at = now() "
        "WHERE seq = %s",
        (entry.peak_tier, entry.score, entry.score_adjustment, entry.position, row[0]),
    )


def sync_to_db(season: str) -> int:
    entries = fetch_fa_list(season)
    conn = _connect()
    synced = 0
    try:
        for entry in entries:
            try:
                with conn.cursor() as cur:
                    streamer_seq = _upsert_streamer(cur, entry)
                    _upsert_score(cur, streamer_seq, entry, season)
                conn.commit()
                synced += 1
            except Exception as e:
                conn.rollback()
                print(f"{entry.streamer_id} 저장 실패: {e}")
    finally:
        conn.close()
    return synced


if __name__ == "__main__":
    import sys

    season = sys.argv[1] if len(sys.argv) > 1 else "27"
    count = sync_to_db(season)
    print(f"{count}명 DB 반영 완료")
