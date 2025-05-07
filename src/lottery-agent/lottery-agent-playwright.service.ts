import { Browser, chromium, Page } from '@playwright/test';
import { LotteryAgentBaseService } from './lottery-agent-base.service';
import { Injectable, Logger } from '@nestjs/common';
import { LottoConfigService } from 'src/config/lotto/lotto-config.service';

@Injectable()
export class LotteryAgentPlayWrightService extends LotteryAgentBaseService {
  /**
   * 자동화에 사용되는 Playwright Browser 인스턴스입니다.
   * 웹 상호작용을 위한 브라우저 프로세스를 관리합니다.
   */
  private browser: Browser;

  /**
   * 격리된 브라우징 세션을 나타내는 브라우저 컨텍스트입니다.
   * 각 컨텍스트는 별도의 쿠키, 로컬 스토리지 및 캐시를 가집니다.
   */
  private page: Page;
  private _baseUrl = 'https://www.dhlottery.co.kr/user.do?method=login&returnUrl=';
  private _logger = new Logger(LotteryAgentPlayWrightService.name);

  constructor(private readonly _config: LottoConfigService) {
    super();
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: false, // 브라우저 화면을 보려면 false로 설정
    });

    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
    });

    this.page = await context.newPage();
  }

  public async login(request: { id: string; password: string }): Promise<void> {
    if (!this._checkAgentStatus()) await this.initialize();
    const { id, password } = this._config;

    await this.page.fill('#userId', id);
    await this.page.fill('#password', password);

    // 로그인 버튼 클릭
    await this.page.click('.btn_common.lrg.blu');

    // 로그인 성공 확인
    try {
      // 5초 동안 로그인 성공 여부 확인
      await this.page.waitForSelector('.gnb_person_box', { timeout: 5000 });
      this._logger.log('로그인 성공!');
    } catch (error) {
      // 로그인 실패 확인 (에러 메시지 확인)
      const errorMessage = await this.page.textContent('.error');
      if (errorMessage) {
        this._logger.error(`로그인 실패: ${errorMessage}`);
      } else {
        this._logger.error('로그인 실패: 알 수 없는 이유');
      }
    }
  }
  public getLottoNumber(round?: number): Promise<number[]> {
    throw new Error('Method not implemented.');
  }

  private _checkAgentStatus() {
    return this.browser && this.page;
  }
}
