# 로그 확인 & CloudWatch Logs 연동

## 1. SSH로 즉시 확인 (에이전트 설치 불필요)

```bash
ssh -i your-key.pem ubuntu@<EC2-IP>
cd ~/lol_match   # docker-compose.yml이 있는 경로

docker compose logs -f backend      # 콘솔 출력 (app.log와 동일 내용)
docker compose logs -f frontend     # nginx access/error (기본 이미지가 stdout/stderr로 심볼릭 링크)

tail -f logs/backend/access.log     # ACCESS_LOG는 콘솔에 안 찍히므로 파일로만 확인 가능
tail -f logs/backend/error.log
```

## 2. CloudWatch Logs 연동 (콘솔에서 SSH 없이 검색)

### 2-1. IAM 권한 부여
EC2 인스턴스에 연결된 IAM 역할에 `CloudWatchAgentServerPolicy`를 붙인다.
- 역할이 없다면: IAM → 역할 생성 → EC2 → `CloudWatchAgentServerPolicy` 연결 → EC2 인스턴스에 역할 연결(EC2 콘솔 → 작업 → 보안 → IAM 역할 수정).

### 2-2. 에이전트 설치 (EC2 Ubuntu에서 SSH로 실행)
```bash
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
```

### 2-3. 설정 파일 배포
이 저장소의 [deploy/cloudwatch-agent-config.json](../deploy/cloudwatch-agent-config.json)을 EC2로 복사한다. `file_path`는 `docker-compose.yml`의 `./logs/backend` 바인드 마운트가 실제로 풀리는 절대경로(예: `/home/ubuntu/lol_match/logs/backend/*.log`)와 일치해야 하므로, 배포 경로가 다르면 수정할 것.

```bash
scp -i your-key.pem deploy/cloudwatch-agent-config.json ubuntu@<EC2-IP>:/tmp/config.json
ssh -i your-key.pem ubuntu@<EC2-IP>
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc
sudo mv /tmp/config.json /opt/aws/amazon-cloudwatch-agent/etc/config.json
```

### 2-4. 에이전트 시작
```bash
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# 상태 확인
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a status
```

### 2-5. 확인
AWS 콘솔 → CloudWatch → 로그 그룹에서 `/lol-match/backend/app`, `/lol-match/backend/error`, `/lol-match/backend/access`가 생성되고 로그가 쌓이는지 확인.

로그가 안 보이면:
- `logs/backend` 디렉터리가 실제로 파일을 담고 있는지 (`docker-compose.yml`의 volume 마운트가 적용된 뒤 컨테이너를 재기동했는지) 확인
- 에이전트 로그: `sudo tail -f /opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log`
- IAM 역할이 인스턴스에 실제로 연결됐는지 (EC2 콘솔에서 확인)
