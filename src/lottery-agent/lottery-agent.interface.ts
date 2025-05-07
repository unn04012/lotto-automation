import { Browser, BrowserContext, Page } from '@playwright/test';

export interface ILotteryAgent {
  /**
   * 자동화에 사용되는 Playwright Browser 인스턴스입니다.
   * 웹 상호작용을 위한 브라우저 프로세스를 관리합니다.
   */
  browser: Browser;

  /**
   * 격리된 브라우징 세션을 나타내는 브라우저 컨텍스트입니다.
   * 각 컨텍스트는 별도의 쿠키, 로컬 스토리지 및 캐시를 가집니다.
   */
  browserContext: BrowserContext;

  /**
   * 브라우저 컨텍스트 내의 활성 페이지입니다.
   * 웹 페이지와 상호작용(클릭, 타이핑 등)하는 데 사용됩니다.
   */
  page: Page;

  /**
   * 브라우저 자동화 환경을 초기화합니다.
   * 필요한 구성으로 브라우저 인스턴스를 설정합니다.
   *
   * @returns 초기화된 Browser 인스턴스로 해결되는 Promise를 반환합니다.
   */
  initialize(): Promise<void>;
  /**
   * 로그인 시도를 합니다.
   * @param request
   */
  login(request: { id: string; password: string }): Promise<void>;

  /**
   * 로또 정보를 조회합니다.
   * @param round 회차 default latest round
   */
  getLottoNumber(round?: number): Promise<number[]>;
}
