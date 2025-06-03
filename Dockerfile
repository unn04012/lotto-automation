# Stage 1: 빌드 스테이지
FROM --platform=linux/amd64 mcr.microsoft.com/playwright:v1.52.0-jammy AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 브라우저도 미리 준비 (hermetic install)
RUN PLAYWRIGHT_BROWSERS_PATH=/app/browsers npx playwright install chromium

# Stage 2: 런타임 스테이지
FROM --platform=linux/amd64 public.ecr.aws/lambda/nodejs:20

# 시스템 의존성 설치
RUN dnf -y install \
    nss dbus atk cups at-spi2-atk libdrm \
    libXcomposite libXdamage libXfixes libXrandr \
    mesa-libgbm pango alsa-lib liberation-fonts \
    gdk-pixbuf2 nspr pciutils xdg-utils

# 빌드 결과물 복사
COPY --from=builder /app/dist ${LAMBDA_TASK_ROOT}/dist
COPY --from=builder /app/package*.json ${LAMBDA_TASK_ROOT}/
COPY --from=builder /app/node_modules ${LAMBDA_TASK_ROOT}/node_modules
COPY --from=builder /app/browsers ${LAMBDA_TASK_ROOT}/browsers

# 권한 설정
RUN chmod 755 -R ${LAMBDA_TASK_ROOT}

# 환경변수 설정
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=${LAMBDA_TASK_ROOT}/browsers

CMD [ "dist/main.handler" ]