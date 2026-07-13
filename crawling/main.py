from fastapi import FastAPI

from crawler import fetch_fa_list
from schemas import FaEntry

app = FastAPI(title="lol-match crawling")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/crawl/fa/{season}", response_model=list[FaEntry])
def crawl_fa(season: str):
    return fetch_fa_list(season)
