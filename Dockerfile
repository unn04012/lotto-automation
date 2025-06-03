# Stage 1: 빌드 스테이지 (가벼운 Alpine 기반)
FROM --platform=linux/amd64 node:20-slim AS builder

RUN apt-get update --allow-insecure-repositories && \
    apt-get install -y --allow-unauthenticated \
    curl \
    gnupg \
    ca-certificates \
    && curl -fsSL https://ftp-master.debian.org/keys/archive-key-12.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/debian-archive-keyring.gpg \
    && curl -fsSL https://ftp-master.debian.org/keys/archive-key-12-security.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/debian-archive-keyring-security.gpg \
    && apt-get update && \
    apt-get install -y \
    build-essential \
    cmake \
    autoconf \
    automake \
    libtool \
    pkg-config \
    libcurl4-openssl-dev \
    unzip \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# aws-lambda-ric 설치
RUN npm install aws-lambda-ric@3.3.0

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# Stage 2: 런타임 스테이지 (Playwright 이미지 사용)
FROM --platform=linux/amd64 mcr.microsoft.com/playwright:v1.52.0-noble

# Lambda 환경변수 설정
ENV LAMBDA_TASK_ROOT=/var/task
ENV LAMBDA_RUNTIME_DIR=/var/runtime

# Lambda 작업 디렉토리 생성 및 설정
RUN mkdir -p ${LAMBDA_TASK_ROOT}
WORKDIR ${LAMBDA_TASK_ROOT}

# 빌드 결과물 복사 (aws-lambda-ric도 포함)
COPY --from=builder /app/dist ${LAMBDA_TASK_ROOT}/dist
COPY --from=builder /app/package*.json ${LAMBDA_TASK_ROOT}/
COPY --from=builder /app/node_modules ${LAMBDA_TASK_ROOT}/node_modules

# Lambda 및 Playwright 환경변수 설정
ENV NODE_ENV=production
ENV IS_LAMBDA_ENVIRONMENT=true
ENV NPM_CONFIG_CACHE=/tmp/.npm
# Playwright 설정 (이미 설치된 브라우저 사용)
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
# Chromium 실행 최적화 플래그 (Lambda 환경용)
ENV CHROMIUM_FLAGS="--no-sandbox --disable-dev-shm-usage --disable-gpu --disable-software-rasterizer --single-process --disable-extensions --disable-plugins"

# 권한 설정
RUN chmod 755 -R ${LAMBDA_TASK_ROOT} && \
    chmod +x ${LAMBDA_TASK_ROOT}/node_modules/.bin/aws-lambda-ric

# Lambda Runtime Interface Client 설정
ENTRYPOINT ["/var/task/node_modules/.bin/aws-lambda-ric"]
# Lambda 함수 핸들러 설정
CMD [ "dist/main.handler" ]