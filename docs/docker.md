docker run -d \
  --name lol_match_backend \
  -p 8080:8080 \
  -e DB_URL="" \
  -e DB_USERNAME="" \
  -e DB_PASSWORD="" \
  -e RIOT_API_KEY="" \
  wookhyunkim/lol_match_backend:latest

docker run -d \
  --name lol_match_frontend \
  -p 5173:80 \
  wookhyunkim/lol_match_frontend:latest

docker run -d \
  --name lol_match_crawling \
  -p 8000:8000 \
  wookhyunkim/lol_match_crawling:latest

# ---- docker compose (recommended: pins both images to a specific CI build) ----
# Each push to main is tagged both `latest` and `sha-<short-hash>` by CI.
# Pin to the sha tag so a deploy always uses a known, reproducible build,
# and rolling back is just re-running with the previous sha.
#
# `sha-abc1234` / `sha-def5678` below are EXAMPLE values only — they do not
# exist on Docker Hub. Before deploying, get the real tag for the commit
# you're deploying, e.g.:
#
#   git rev-parse --short HEAD        # -> abc1234, so the tag is sha-abc1234
#
# or check the tag printed by the `build-and-push` job in GitHub Actions,
# or look it up directly at hub.docker.com/r/wookhyunkim/lol_match_backend/tags.
#
#   BACKEND_TAG=sha-abc1234 FRONTEND_TAG=sha-def5678 CRAWLING_TAG=sha-ghi9012 docker compose up -d
#
# Omitting BACKEND_TAG/FRONTEND_TAG/CRAWLING_TAG falls back to `latest`.
docker compose pull
BACKEND_TAG=sha-abc1234 FRONTEND_TAG=sha-def5678 CRAWLING_TAG=sha-ghi9012 docker compose up -d
