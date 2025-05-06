# 로또 자동화 프로젝트 (Lotto Automation)

한국 로또 6/45 구매 및 조회를 자동화하는 프로젝트입니다.

## 프로젝트 소개

이 프로젝트는 [동행복권](https://dhlottery.co.kr) 사이트에서 다음과 같은 작업을 자동화합니다:

- 로그인
- 로또 구매
- 당첨 번호 조회
- 당첨 결과 확인

## 기술 스택

- **웹 자동화**: Playwright
- **서버**: AWS ECS-EC2
- **데이터베이스**: DynamoDB
- **언어**: JavaScript/TypeScript
- **컨테이너화**: Docker

## 주요 기능

1. **로그인 자동화**
   - 계정 정보를 안전하게 저장하고 자동 로그인 지원

2. **로또 구매 자동화**
   - 자동 번호 선택 또는 사용자 지정 번호로 구매
   - 정기 구매 스케줄링

3. **당첨 정보 확인**
   - 구매한 로또의 당첨 여부 확인
   - 당첨 통계 및 히스토리 관리

4. **알림 서비스**
   - 당첨 시 이메일 또는 기타 방식으로 알림

## 구성 아키텍처

```
AWS ECS-EC2
├── Playwright Container
│   ├── Login Service
│   ├── Purchase Service
│   └── Result Checking Service
└── DynamoDB
    ├── User Info
    ├── Purchased Tickets
    └── Results History
```

## 향후 계획

- API 엔드포인트 구축
- 웹 인터페이스 개발
- 고급 번호 추천 알고리즘 구현
- 모바일 앱 개발

## 라이센스

MIT

## 기여

Pull Request와 Issue는 언제나 환영합니다!
