import { Browser, BrowserContext, Frame, Page, chromium as playwright } from '@playwright/test';
import { ILotteryAgentService, LottoResult } from './lottery-agent.service.interface';
import { Injectable, Logger } from '@nestjs/common';
import { PlayWrightConfigService } from 'src/config/playwright/playwright-config.service';

/** 동행복권 포털 (로그인 / 당첨결과) */
const PORTAL_URL = 'https://www.dhlottery.co.kr';
/** 동행복권 게임 서버 (구매 팝업) */
const GAME_URL = 'https://el.dhlottery.co.kr';

const LOGIN_PATH = '/login';
const RESULT_PATH = '/lt645/result';
/** 회차별 당첨결과 조회 API. srchLtEpsd 기준 앞뒤 회차를 함께 내려줍니다. */
const RESULT_API_PATH = '/lt645/selectPstLt645InfoNew.do';
const GAME_PATH = '/game/TotalGame.jsp?LottoId=LO40';

const DESKTOP_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** 로또 6/45 한 회차 최대 구매 게임 수 (5,000원 한도) */
const MAX_GAMES_PER_ROUND = 5;

/**
 * 당첨결과 조회 API 응답의 회차 정보입니다.
 */
type Lt645WinInfo = {
  ltEpsd: number;
  tm1WnNo: number;
  tm2WnNo: number;
  tm3WnNo: number;
  tm4WnNo: number;
  tm5WnNo: number;
  tm6WnNo: number;
  bnsWnNo: number;
};

@Injectable()
export class LotteryAgentPlayWrightService implements ILotteryAgentService {
  /**
   * 자동화에 사용되는 Playwright Browser 인스턴스입니다.
   * 웹 상호작용을 위한 브라우저 프로세스를 관리합니다.
   */
  private browser: Browser;

  /**
   * 격리된 브라우징 세션을 나타내는 브라우저 컨텍스트입니다.
   * 각 컨텍스트는 별도의 쿠키, 로컬 스토리지 및 캐시를 가집니다.
   */
  private context: BrowserContext;

  private page: Page;
  private _logger = new Logger(LotteryAgentPlayWrightService.name);

  /**
   * 디버깅 모드: true로 설정하면 에러 발생 시에도 브라우저를 닫지 않고 유지합니다.
   * 로컬에서 실패 원인을 눈으로 확인할 때만 사용하세요.
   */
  private _keepBrowserOnError = false;

  constructor(private readonly _playwrightConfigService: PlayWrightConfigService) {}

  /**
   * 디버깅 모드를 설정합니다.
   * @param keep true로 설정하면 에러 발생 시에도 브라우저가 자동으로 닫히지 않습니다.
   */
  public setKeepBrowserOnError(keep: boolean): void {
    this._keepBrowserOnError = keep;
    this._logger.log(`디버깅 모드 설정: ${keep ? '활성화' : '비활성화'}`);
  }

  /**
   * browser context를 초기화합니다.
   */
  public async initialize(): Promise<void> {
    if (this._checkAgentStatus()) return;

    this.browser = await playwright.launch({
      headless: this._playwrightConfigService.headless,
      args: this._playwrightConfigService.launchOptions,
    });

    this._logger.log('successfully launched Playwright browser');

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: DESKTOP_USER_AGENT,
      locale: 'ko-KR',
      extraHTTPHeaders: {
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
    });

    this.page = await this.context.newPage();

    // 구매 팝업(window.open)은 직접 URL로 이동하므로 새 창은 열리지 않게 막습니다.
    await this.page.addInitScript(() => {
      window.open = () => null;
    });

    // 처리되지 않은 alert/confirm 이 뜨면 페이지가 멈추므로 항상 수락합니다.
    this.page.on('dialog', async (dialog) => {
      this._logger.warn(`브라우저 dialog(${dialog.type()}): ${dialog.message()}`);
      await dialog.accept().catch(() => undefined);
    });
  }

  public async login(request: { id: string; password: string }): Promise<void> {
    try {
      await this.initialize();

      const { id, password } = request;

      this._logger.log('동행복권 로그인 페이지로 이동 중...');

      const response = await this.page.goto(`${PORTAL_URL}${LOGIN_PATH}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      this._logger.log(`response status: ${response?.status()}, login page URL: ${this.page.url()}`);

      // 로그인 폼은 입력값을 RSA로 암호화한 뒤 hidden 필드(#userId, #userPswdEncn)에 넣어 전송합니다.
      // 암호화는 페이지의 자체 스크립트가 수행하므로 표시용 입력 필드만 채우면 됩니다.
      await this.page.waitForSelector('#inpUserId', { timeout: 15000 });
      await this.page.fill('#inpUserId', id);
      await this.page.fill('#inpUserPswdEncn', password);

      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {
          this._logger.warn('로그인 후 페이지 이동이 감지되지 않았습니다.');
        }),
        this.page.click('#btnLogin'),
      ]);

      await this._assertLoggedIn();

      this._logger.log(`로그인 성공! 현재 URL: ${this.page.url()}`);
    } catch (error) {
      this._logger.error('로그인 중 에러 발생:', error);
      await this._handleFailure();
      throw error;
    }
  }

  public async getLottoNumber(round?: number): Promise<LottoResult> {
    try {
      await this.initialize();

      // 당첨결과는 비로그인으로도 조회할 수 있습니다.
      const response = await this.page.goto(`${PORTAL_URL}${RESULT_PATH}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      if (!response?.ok()) {
        throw new Error(`당첨결과 페이지 이동 실패: ${response?.status()}`);
      }

      const targetRound = round ?? (await this._findLatestRoundNumber());

      this._logger.log(`조회 회차: ${targetRound}`);

      const winInfo = await this._fetchWinInfo(targetRound);

      return {
        round: winInfo.ltEpsd,
        winningNumbers: [winInfo.tm1WnNo, winInfo.tm2WnNo, winInfo.tm3WnNo, winInfo.tm4WnNo, winInfo.tm5WnNo, winInfo.tm6WnNo],
        bonusNumber: winInfo.bnsWnNo,
      };
    } catch (error) {
      this._logger.error('로또 번호 조회 중 에러 발생:', error);
      await this._handleFailure();
      throw error;
    }
  }

  public async buyLottery(numbers: number[]): Promise<{ round: number }> {
    if (numbers.length !== 6) {
      throw new Error(`로또 번호는 6개여야 합니다. 입력값: ${numbers.length}개`);
    }
    if (new Set(numbers).size !== 6) {
      throw new Error(`로또 번호에 중복이 있습니다: ${numbers.join(', ')}`);
    }
    if (numbers.some((num) => !Number.isInteger(num) || num < 1 || num > 45)) {
      throw new Error(`로또 번호는 1~45 사이의 정수여야 합니다: ${numbers.join(', ')}`);
    }

    try {
      const frame = await this._openGameFrame();
      const currentRound = await this.getCurrentRound(frame);

      // 혼합선택 탭으로 전환한 뒤 번호를 직접 체크합니다.
      await frame.click('#num1');
      await frame.waitForTimeout(500);

      for (const num of numbers) {
        await this._checkNumber(frame, num);
      }

      const checked = await frame.$$eval('input[id^="check645num"]:checked', (inputs) => inputs.map((input) => Number(input.id.replace('check645num', ''))));

      if (checked.length !== 6) {
        throw new Error(`번호 선택 실패. 선택된 번호: ${checked.join(', ') || '없음'}`);
      }

      this._logger.log(`선택한 번호: ${checked.sort((a, b) => a - b).join(', ')}`);

      await this._submitSelection(frame);
      await this._confirmPurchase(frame);
      await this._closeReportLayer(frame);

      this._logger.log(`로또 수동 구매가 완료되었습니다. (${currentRound}회)`);

      return { round: currentRound };
    } catch (error) {
      this._logger.error('로또 수동 구매 중 에러 발생:', error);
      await this._handleFailure();
      throw error;
    }
  }

  public buyAnnuityLottery(numbers: number[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async buyLotteryAutomation(): Promise<{ purchasedNumbers: number[]; round: number }> {
    try {
      const frame = await this._openGameFrame();
      const currentRound = await this.getCurrentRound(frame);

      // 자동번호발급 탭. 번호는 구매가 완료된 뒤에 발급되므로 사전에 알 수 없습니다.
      await frame.click('#num2');
      await frame.waitForTimeout(500);

      await this._setGameCount(frame, 1);
      await this._submitSelection(frame);
      await this._confirmPurchase(frame);

      const purchasedNumbers = await this._extractPurchasedNumbers(frame);

      this._logger.log(`로또 자동 구매가 완료되었습니다. (${currentRound}회) 발급 번호: ${purchasedNumbers.join(', ')}`);

      return { purchasedNumbers, round: currentRound };
    } catch (error) {
      this._logger.error('로또 자동 구매 중 에러 발생:', error);
      await this._handleFailure();
      throw error;
    }
  }

  /**
   * 현재 판매중인 회차를 반환합니다.
   */
  private async getCurrentRound(frame: Frame): Promise<number> {
    try {
      await frame.waitForSelector('#curRound', { timeout: 15000 });

      const text = await frame.textContent('#curRound');
      const currentRound = Number(text?.trim());

      if (!Number.isInteger(currentRound) || currentRound <= 0) {
        throw new Error(`회차 파싱 실패: "${text}"`);
      }

      this._logger.log(`현재 판매 회차: ${currentRound}`);

      return currentRound;
    } catch (error) {
      this._logger.error('getCurrentRound 오류:', error);
      throw error;
    }
  }

  /**
   * 브라우저 세션을 명시적으로 종료합니다.
   * 모든 작업이 완료된 후 호출해야 합니다.
   */
  public async close(): Promise<void> {
    try {
      if (this.page && !this.page.isClosed()) {
        await this.page.close();
        this._logger.log('페이지가 닫혔습니다.');
      }
      if (this.browser && this.browser.isConnected()) {
        await this.browser.close();
        this._logger.log('브라우저가 닫혔습니다.');
      }
    } catch (error) {
      this._logger.error('브라우저 종료 중 오류 발생:', error);
    }
  }

  // ---------------------------------------------------------------------------
  // 내부 헬퍼
  // ---------------------------------------------------------------------------

  private _checkAgentStatus() {
    return Boolean(this.browser?.isConnected() && this.page && !this.page.isClosed());
  }

  /**
   * 동행복권은 모든 페이지에 로그인 여부를 전역 변수로 렌더링합니다.
   * 최상위 const 바인딩이라 window 프로퍼티로는 접근할 수 없어 표현식으로 평가합니다.
   */
  private async _isLoggedIn(): Promise<boolean> {
    return this.page.evaluate<boolean>(`typeof isLoggedIn !== 'undefined' && isLoggedIn === true`).catch(() => false);
  }

  private async _assertLoggedIn(): Promise<void> {
    if (await this._isLoggedIn()) return;

    const bodyText = await this.page
      .evaluate<string>(`document.body.innerText`)
      .then((text) => text.replace(/\s+/g, ' ').trim().slice(0, 200))
      .catch(() => '');

    throw new Error(`로그인 실패 (URL: ${this.page.url()}) ${bodyText}`);
  }

  /**
   * 당첨결과 페이지의 회차 선택 목록에서 최신 회차를 찾습니다.
   */
  private async _findLatestRoundNumber(): Promise<number> {
    // 회차 select 는 커스텀 드롭다운에 가려져 화면에 보이지 않으므로 DOM 부착만 기다립니다.
    await this.page.waitForSelector('#srchStrLtEpsd option', { timeout: 15000, state: 'attached' });

    const rounds = await this.page.$$eval('#srchStrLtEpsd option', (options) => options.map((option) => Number((option as HTMLOptionElement).value)));
    const latest = Math.max(...rounds.filter((round) => Number.isInteger(round) && round > 0));

    if (!Number.isFinite(latest) || latest <= 0) {
      throw new Error('failed to find latest round number');
    }

    return latest;
  }

  /**
   * 회차별 당첨번호를 조회 API에서 가져옵니다.
   * 응답에는 요청 회차의 앞뒤 회차가 함께 담기므로 해당 회차를 골라냅니다.
   */
  private async _fetchWinInfo(round: number): Promise<Lt645WinInfo> {
    const response = await this.context.request.get(`${PORTAL_URL}${RESULT_API_PATH}`, {
      params: { srchDir: 'center', srchLtEpsd: String(round) },
      headers: { Accept: 'application/json', Referer: `${PORTAL_URL}${RESULT_PATH}` },
      timeout: 20000,
    });

    if (!response.ok()) {
      throw new Error(`당첨번호 조회 API 실패: ${response.status()}`);
    }

    const body = (await response.json()) as { data?: { list?: Lt645WinInfo[] } };
    const winInfo = body.data?.list?.find((item) => item.ltEpsd === round);

    if (!winInfo) {
      throw new Error(`${round}회 당첨번호를 찾을 수 없습니다. 아직 추첨 전이거나 존재하지 않는 회차입니다.`);
    }

    return winInfo;
  }

  /**
   * 구매 게임 페이지를 열고 게임 iframe을 반환합니다.
   */
  private async _openGameFrame(): Promise<Frame> {
    await this.initialize();

    if (!(await this._isLoggedIn())) {
      // 구매 페이지는 세션이 없으면 빈 문서를 내려주므로 먼저 로그인 상태를 확인합니다.
      await this.page.goto(`${PORTAL_URL}/main`, { waitUntil: 'domcontentloaded', timeout: 30000 });

      if (!(await this._isLoggedIn())) {
        throw new Error('로그인이 필요합니다. login()을 먼저 호출하세요.');
      }
    }

    this._logger.log('로또 구매 페이지로 이동 중...');

    await this.page.goto(`${GAME_URL}${GAME_PATH}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await this.page.waitForSelector('#ifrm_tab', { timeout: 15000 });

    const frameElement = await this.page.$('#ifrm_tab');
    const frame = await frameElement?.contentFrame();

    if (!frame) {
      throw new Error('구매 iframe 컨텐츠에 접근할 수 없습니다');
    }

    await this._waitForQueue(frame);
    await frame.waitForSelector('#curRound', { timeout: 30000, state: 'visible' });

    this._logger.log(`구매 iframe URL: ${frame.url()}`);

    return frame;
  }

  /**
   * 접속자가 많을 때 뜨는 대기열 레이어가 사라질 때까지 기다립니다.
   */
  private async _waitForQueue(frame: Frame): Promise<void> {
    const queue = frame.locator('#popupLayer.layer-wait');

    if (!(await queue.isVisible().catch(() => false))) return;

    this._logger.warn('접속 대기열에 진입했습니다. 순서를 기다립니다...');
    await queue.waitFor({ state: 'hidden', timeout: 300000 });
    this._logger.log('대기열 통과');
  }

  /**
   * 혼합선택 탭에서 번호 하나를 체크합니다.
   */
  private async _checkNumber(frame: Frame, num: number): Promise<void> {
    const label = frame.locator(`label[for="check645num${num}"]`);

    if (await label.count()) {
      await label.click({ timeout: 5000 });
    } else {
      await frame.locator(`#check645num${num}`).click({ force: true, timeout: 5000 });
    }

    await frame.waitForTimeout(100);
  }

  /**
   * 자동번호발급 탭의 구매 수량을 지정합니다.
   */
  private async _setGameCount(frame: Frame, count: number): Promise<void> {
    if (count < 1 || count > MAX_GAMES_PER_ROUND) {
      throw new Error(`구매 수량은 1~${MAX_GAMES_PER_ROUND} 사이여야 합니다: ${count}`);
    }

    await frame.selectOption('#amoundApply', String(count));
    await frame.waitForTimeout(300);
  }

  /**
   * 선택한 번호를 확정(확인 버튼)하고 구매 목록에 담겼는지 검증합니다.
   */
  private async _submitSelection(frame: Frame): Promise<void> {
    await frame.click('#btnSelectNum');
    await frame.waitForTimeout(1000);

    const cart = await frame.locator('#selectRow').innerText();

    // 담기지 않으면 모든 슬롯이 "미지정" 상태로 남습니다.
    if (!cart || !/자동|수동/.test(cart)) {
      throw new Error(`구매 목록에 번호가 담기지 않았습니다: ${cart?.replace(/\s+/g, ' ').trim()}`);
    }

    this._logger.log(`구매 목록: ${cart.replace(/\s+/g, ' ').trim()}`);
  }

  /**
   * 구매하기 버튼을 눌러 나타나는 확인 레이어에서 구매를 확정합니다.
   */
  private async _confirmPurchase(frame: Frame): Promise<void> {
    await frame.click('#btnBuy');

    const confirmLayer = frame.locator('#popupLayerConfirm');
    await confirmLayer.waitFor({ state: 'visible', timeout: 15000 });

    const message = (await confirmLayer.locator('.layer-message').innerText()).trim();

    this._logger.log(`구매 확인 레이어: "${message}"`);

    if (!message.includes('구매하시겠습니까')) {
      // 한도 초과 등 구매를 진행할 수 없는 안내인 경우 취소하고 중단합니다.
      await frame.evaluate(`closepopupLayerConfirm(false)`).catch(() => undefined);
      throw new Error(`구매를 진행할 수 없습니다: ${message}`);
    }

    // 확인 버튼의 onclick과 동일한 동작입니다.
    await frame.evaluate(`closepopupLayerConfirm(true)`);
    await frame.waitForTimeout(2000);

    await this._assertNoAlert(frame);
  }

  /**
   * 구매 실패 시 뜨는 알림 레이어를 확인하고, 있으면 에러로 전환합니다.
   */
  private async _assertNoAlert(frame: Frame): Promise<void> {
    const alertLayer = frame.locator('#popupLayerAlert');

    if (!(await alertLayer.isVisible().catch(() => false))) return;

    const message = (
      await alertLayer
        .locator('.layer-message')
        .innerText()
        .catch(() => '')
    ).trim();

    await frame.evaluate(`closepopupLayerAlert()`).catch(() => undefined);

    throw new Error(`구매가 정상 처리되지 않았습니다: ${message || '알 수 없는 사유'}`);
  }

  /**
   * 구매 완료 레이어(#reportRow)에서 발급된 번호를 추출합니다.
   */
  private async _extractPurchasedNumbers(frame: Frame): Promise<number[]> {
    await frame.waitForSelector('#reportRow li', { timeout: 15000 });

    const numbers = await frame.$$eval('#reportRow li:first-child .nums span', (spans) => spans.map((span) => Number(span.textContent?.trim())));
    const valid = numbers.filter((num) => Number.isInteger(num) && num >= 1 && num <= 45);

    if (valid.length !== 6) {
      // 마크업이 바뀌었더라도 구매 자체는 성공했으므로 텍스트에서 한 번 더 시도합니다.
      const text = await frame.locator('#reportRow li').first().innerText();
      const fallback = (text.match(/\b([1-9]|[1-3]\d|4[0-5])\b/g) ?? []).map(Number).slice(0, 6);

      this._logger.warn(`#reportRow 파싱 결과가 6개가 아닙니다(${valid.length}개). 원본 텍스트: ${text.replace(/\s+/g, ' ').trim()}`);

      if (fallback.length === 6) {
        await this._closeReportLayer(frame);
        return fallback;
      }

      throw new Error(`발급 번호 추출 실패. 구매는 완료되었을 수 있으니 구매내역을 확인하세요. (원본: ${text.replace(/\s+/g, ' ').trim()})`);
    }

    await this._closeReportLayer(frame);

    return valid;
  }

  /**
   * 구매 완료 레이어를 닫아 다음 작업에 영향이 없도록 합니다.
   */
  private async _closeReportLayer(frame: Frame): Promise<void> {
    await frame
      .locator('input[name="closeLayer"]')
      .click({ timeout: 5000 })
      .catch(() => this._logger.log('닫기 버튼을 찾을 수 없거나 필요하지 않습니다.'));
  }

  /**
   * 에러 발생 시 현재 상태를 남깁니다.
   * 디버깅 모드가 아니면 브라우저를 정리해 프로세스가 남지 않게 합니다.
   */
  private async _handleFailure(): Promise<void> {
    this._logger.warn(`현재 페이지 URL: ${this.page?.url() ?? 'N/A'}`);

    if (this._keepBrowserOnError) {
      this._logger.warn('⚠️ 디버깅 모드: 브라우저를 열어둡니다. 수동으로 확인 후 종료하세요.');
      return;
    }

    await this.close();
  }
}
