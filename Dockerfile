# Stage 1: 빌드 스테이지 (NestJS 컴파일)
FROM --platform=linux/amd64 mcr.microsoft.com/playwright:v1.52.0-noble AS builder

WORKDIR /app

# package.json 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스코드 복사 및 빌드
COPY . .
RUN npm run build

# Stage 2: 최종 런타임 스테이지 (Lambda)
# NoddeJS 20 (Amazon linux 2023 "AL2023")
FROM --platform=linux/amd64 public.ecr.aws/lambda/nodejs:22

# Chromium 실행에 필요한 시스템 의존성 설치
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

# 빌드된 NestJS 앱 전체 복사 (dist 폴더 전체)
COPY --from=builder /app/dist ${LAMBDA_TASK_ROOT}/dist
COPY --from=builder /app/package*.json ${LAMBDA_TASK_ROOT}/

RUN chmod 755 -R ${LAMBDA_TASK_ROOT}

WORKDIR ${LAMBDA_TASK_ROOT}

# 프로덕션 의존성 설치
RUN npm ci --only=production

# Hermetic install: node_modules/playwright-core/.local-browsers에 브라우저 설치
RUN PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install chromium

# 환경변수 설정
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=0

# Lambda 핸들러 실행 (dist/main.handler로 변경)
CMD [ "dist/main.handler" ]