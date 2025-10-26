# 로또 자동화

AWS Lambda와 Serverless Framework를 활용한 한국 로또 6/45 자동 구매 및 당첨 확인 프로젝트입니다.

## 프로젝트 개요

이 프로젝트는 [동행복권](https://dhlottery.co.kr) 웹사이트에서 다음 작업들을 자동화합니다:

- 로그인
- 로또 티켓 구매
- 당첨번호 조회
- 당첨금 확인

## 기술 스택

- **웹 자동화**: Playwright
- **인프라**: AWS Lambda, ,API Gateway, AWS Parameter Store
- **데이터베이스**: DynamoDB
- **언어**: JavaScript/TypeScript, Nest.js
- **컨테이너화**: Docker
- **배포**: Serverless Framework

## 자동화 항목

### 1. **자동 로그인**

- 계정 정보를 안전하게 저장하고 로그인 프로세스 처리
- AWS Parameter Store를 통한 민감한 정보 관리

### 2. **자동 티켓 구매**

- 랜덤 번호 생성 또는 사용자 지정 번호 선택 지원
- 정기적인 자동 구매 스케줄링
- Lambda 함수를 통한 서버리스 실행

### 3. **당첨 결과 확인**

- 구매한 티켓의 당첨 여부 확인
- 당첨 통계 및 이력 관리
- DynamoDB를 통한 데이터 영속성

### 4. **알림 서비스**

- 당첨 시 슬랙 또는 기타 알림 발송
- 구매 완료 및 결과 확인 알림

### 5. **스케줄링**

- CloudWatch Events를 통한 자동 실행
- 매주 정기적인 로또 구매 및 결과 확인

## 아키텍처 다이어그램

![Lotto Automation Architecture](./lotto-automation.drawio.svg)
