docker run -d \
  --name lol_match_backend \
  -p 8080:8080 \
  -e DB_URL="" \
  -e DB_USERNAME="" \
  -e DB_PASSWORD="" \
  -e RIOT_API_KEY="" \
  wookhyunkim/lol_match_backend:latest
