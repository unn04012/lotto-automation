# Stage 1: Playwright 환경에서 빌드
FROM --platform=linux/amd64 mcr.microsoft.com/playwright:v1.52.0-noble AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Lambda 런타임
FROM --platform=linux/amd64 public.ecr.aws/lambda/nodejs:20

# 시스템 의존성 설치
RUN dnf -y install \
    nss \
    dbus \
    atk \
    cups \
    at-spi2-atk \
    libdrm \
    libXcomposite \
    libXdamage \
    libXfixes \
    libXrandr \
    mesa-libgbm \
    pango \
    alsa-lib

# 빌드 결과물 복사
COPY --from=builder /app/dist ${LAMBDA_TASK_ROOT}/dist
COPY --from=builder /app/package*.json ${LAMBDA_TASK_ROOT}/

# **핵심: Playwright 브라우저를 표준 경로로 복사**
COPY --from=builder /ms-playwright /ms-playwright

# 실행 권한 설정
RUN find /ms-playwright -name "chrome" -type f -exec chmod +x {} \;

WORKDIR ${LAMBDA_TASK_ROOT}
RUN npm ci --only=production

# 환경변수 설정 (표준 경로 사용)
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

CMD [ "dist/main.handler" ]