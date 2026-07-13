from pydantic import BaseModel


class FaEntry(BaseModel):
    streamer_name: str
    streamer_id: str
    lol_id: str
    lol_tag: str
    peak_tier: str
    score: float
    score_adjustment: float | None = None
    position: str
