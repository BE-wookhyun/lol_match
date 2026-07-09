1. 접속 psql -U id lol_match



CREATE TABLE streamers (
    seq BIGSERIAL PRIMARY KEY,
    streamer_name VARCHAR(100) NOT NULL,
    streamer_id VARCHAR(50) NOT NULL UNIQUE,
    streamer_icon_url VARCHAR(500),
    lol_id VARCHAR(100),
    lol_tag VARCHAR(30),
    soop_channel_id VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


 INSERT INTO streamers (
    streamer_name,
    streamer_id,
    streamer_icon_url,
    lol_id,
    lol_tag,
    soop_channel_id
)
VALUES (
    '이상호',
    'lshooooo',
    'https://stimg.sooplive.com/LOGO/ls/lshooooo/m/lshooooo.webp',
    '이상호93',
    'KR1',
    'teststest'
);



\l          -- 데이터베이스 목록
\c lol_match -- 데이터베이스 변경
\dt         -- 테이블 목록
\d streamers -- 테이블 구조 확인
\du         -- 사용자 목록
\dn         -- 스키마 목록
\q          -- 종료