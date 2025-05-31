import { Browser, Frame, Page, chromium as playwright } from '@playwright/test';
import { ILotteryAgentService, LottoResult } from './lottery-agent.service.interface';
import { Injectable, Logger } from '@nestjs/common';

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
  private page: Page;
  private _baseUrl = 'https://www.dhlottery.co.kr';
  private _logger = new Logger(LotteryAgentPlayWrightService.name);

  /**
   * browser context를 초기화합니다.
   */
  public async initialize(): Promise<void> {
    if (!this._checkAgentStatus()) {
      this.browser = await playwright.launch({
        headless: true, // 브라우저 화면을 보려면 false로 설정
      });
      this._logger.log('successfully launched Playwright browser');

      const context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      });

      this.page = await context.newPage();

      this._logger.log('Playwright browser context가 초기화되었습니다.');
    }
  }

  public async login(request: { id: string; password: string }): Promise<void> {
    await this.initialize();

    const loginPageUrl = `${this._baseUrl}/user.do?method=login&returnUrl=`;
    const { id, password } = request;

    this._logger.log('동행복권 로그인 페이지로 이동 중...');

    await this.page.goto(loginPageUrl);

    await this.page.fill('#userId', id);
    await this.page.fill('input[type="password"]', password);

    // 로그인 버튼 클릭
    await this.page.click('.btn_common.lrg.blu');

    // 로그인 성공 확인
    try {
      // 5초 동안 로그인 성공 여부 확인
      await this.page.waitForSelector('.gnb_person_box', { timeout: 5000 });
      this._logger.log('로그인 성공!');
    } catch (error) {
      // 로그인 실패 확인 (에러 메시지 확인)

      if (error) {
        this._logger.error(`로그인 실패: ${JSON.stringify(error)}`);
      } else {
        this._logger.error('로그인 실패: 알 수 없는 이유');
      }
    }
  }

  /**
   * 최신 회차를 반환합니다.
   * @param page
   * @returns
   */
  private async _findLatestRoundNumber(page: Page) {
    let currentRound = 0;
    this._logger.log('current url: ', page.url);
    this._logger.log(page.url);
    const roundText = await page.textContent('.win_result strong');

    if (roundText) {
      const roundMatch = roundText.match(/(\d+)회/); // [ '1170회', '1170', index: 0, input: '1170회', groups: undefined ]

      currentRound = roundMatch ? Number(roundMatch[1]) : 0;
    } else {
      currentRound = await page.$eval('select[name="drwNo"]', (element: HTMLSelectElement) => {
        return Number(element.value);
      });
    }

    if (currentRound === 0) throw new Error('failed to find latest round number');

    return currentRound;
  }

  public async getLottoNumber(round?: number): Promise<LottoResult> {
    await this.initialize();
    const url = `${this._baseUrl}/gameResult.do?method=byWin`;
    this._logger.log(JSON.stringify(this.page));

    await this.page.goto(url);

    let currentRound: number;

    if (round) {
      // 회차 드롭다운 메뉴 선택
      currentRound = round;
      await this.page.evaluate((roundValue) => {
        // 실제 select 요소 찾기 (검사 후 정확한 선택자로 대체 필요)
        const select = document.querySelector('select[name="drwNo"]') as HTMLSelectElement;

        if (select) {
          select.value = roundValue;
          const event = new Event('change', { bubbles: true });
          select.dispatchEvent(event);
          this._logger.log('find select');
        }

        // hidden input 값도 업데이트
        const hiddenInput = document.querySelector('#drwNo') as HTMLSelectElement;
        if (hiddenInput) hiddenInput.value = roundValue;
      }, round.toString());

      // 조회 버튼 클릭
      await this.page.click('.btn_common form blu');
      await this.page.waitForTimeout(1000); // 결과 로딩 대기
    } else {
      // 현재 선택된 회차 정보 추출
      currentRound = await this._findLatestRoundNumber(this.page);
    }

    const winningNumbers: number[] = [];

    // 기본 6개 번호 추출
    for (let i = 1; i <= 6; i++) {
      const selector = `.win_result .ball_645:nth-child(${i})`;
      const number = await this.page.textContent(selector);

      winningNumbers.push(Number(number?.trim()));
    }

    // 보너스 번호 추출
    const bonusSelector = '.bonus .ball_645';
    const bonusNumberText = await this.page.textContent(bonusSelector);

    const bonusNumber = Number(bonusNumberText?.trim());

    await this.page.close();
    await this.browser.close();

    return {
      round: currentRound,
      bonusNumber,
      winningNumbers,
    };
  }

  public async buyLottery(numbers: number[]): Promise<void> {
    const url = `https://el.dhlottery.co.kr/game/TotalGame.jsp?LottoId=LO40`;
    await this.page.goto(url);

    // iframe이 로드될 때까지 대기
    await this.page.waitForSelector('#ifrm_tab');

    // iframe 요소 가져오기
    const frameElement = await this.page.$('#ifrm_tab');
    const frame = await frameElement?.contentFrame();

    if (!frame) {
      throw new Error('iframe 컨텐츠에 접근할 수 없습니다');
    }

    // 페이지가 완전히 로드될 때까지 대기
    await frame.waitForLoadState('networkidle');

    // 각 번호에 대해 체크박스 선택
    for (const num of numbers) {
      try {
        // 방법 1: JavaScript를 사용하여 체크박스 선택
        await frame.evaluate((num) => {
          const checkbox = document.getElementById(`check645num${num}`) as HTMLInputElement;
          if (checkbox) {
            checkbox.checked = true;
            // change 이벤트 트리거 (페이지의 로직에 필요한 경우)
            const event = new Event('change', { bubbles: true });
            checkbox.dispatchEvent(event);
          }
        }, num);

        // 짧은 대기 시간 추가
        await frame.waitForTimeout(200);
      } catch (error) {
        console.error(`번호 ${num} 선택 중 오류 발생:`, error);
      }
    }

    // 선택 확인 버튼 클릭 (JavaScript 평가 사용)
    await frame.evaluate(() => {
      const button = document.getElementById('btnSelectNum');
      if (button) button.click();
    });

    // 구매 버튼이 나타날 때까지 대기
    await frame.waitForSelector('#btnBuy', { timeout: 10000 });

    // 구매 버튼 클릭 (JavaScript 평가 사용)
    await frame.evaluate(() => {
      const button = document.getElementById('btnBuy');
      if (button) button.click();
    });

    // 확인 대화 상자 대기
    await frame.waitForSelector('input[type="button"][value="확인"]', { timeout: 10000 });

    // 확인 버튼 클릭
    await frame.evaluate(() => {
      const buttons = document.querySelectorAll('input[type="button"][value="확인"]');
      if (buttons.length > 0) {
        const button = buttons[0] as HTMLElement;
        button.click();
      }
    });

    // 첫 번째 확인 대화 상자 대기 (구매하시겠습니까?)
    try {
      // 팝업이 나타날 때까지 대기
      await frame.waitForSelector('.layer-message:has-text("구매하시겠습니까?")', { timeout: 10000 });

      // "확인" 버튼 클릭
      await frame.evaluate(() => {
        const confirmButtons = document.querySelectorAll('input[type="button"][value="확인"]');
        // 여러 확인 버튼 중 closepopupLayerConfirm(true) 함수를 호출하는 버튼 찾기
        for (let i = 0; i < confirmButtons.length; i++) {
          const button = confirmButtons[i] as HTMLElement;
          if (button.getAttribute('onclick')?.includes('closepopupLayerConfirm(true)')) {
            button.click();
            break;
          }
        }
      });

      // 클릭 후 잠시 대기
      await frame.waitForTimeout(1000);
    } catch (error) {
      console.error('첫 번째 확인 팝업 처리 중 오류 발생:', error);
    }

    // 필요한 경우 추가 닫기 버튼 처리
    try {
      await frame.waitForSelector('input[name="closeLayer"]', { timeout: 5000 });
      await frame.evaluate(() => {
        const closeButton = document.querySelector('input[name="closeLayer"]') as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      });
    } catch (error) {
      await frame.waitForSelector('#btnBuy', { timeout: 10000 });
      // 닫기 버튼이 없을 수 있으므로 오류 무시
      this._logger.log('닫기 버튼을 찾을 수 없거나 필요하지 않습니다.');
    }

    await this.page.close();
    await this.browser.close();
  }

  buyAnnuityLottery(numbers: number[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async buyLotteryAutomation(): Promise<{ purchasedNumbers: number[]; round: number }> {
    const url = `https://el.dhlottery.co.kr/game/TotalGame.jsp?LottoId=LO40`;
    await this.page.goto(url);

    // iframe이 로드될 때까지 대기
    await this.page.waitForSelector('#ifrm_tab');

    // iframe 요소 가져오기
    const frameElement = await this.page.$('#ifrm_tab');
    const frame = await frameElement?.contentFrame();

    if (!frame) {
      throw new Error('iframe 컨텐츠에 접근할 수 없습니다');
    }

    // 페이지가 완전히 로드될 때까지 대기
    await frame.waitForLoadState('networkidle');

    const currentRound = await this.getCurrentRound(frame);

    // 자동번호 발급 버튼 클릭
    await frame.evaluate(() => {
      const autoButton = document.getElementById('num2');
      this._logger.log(autoButton);
      if (autoButton) autoButton.click();
    });

    // 잠시 대기하여 자동 번호가 선택되도록 함
    await frame.waitForTimeout(500);

    // 선택 확인 버튼 클릭 (JavaScript 평가 사용)
    await frame.evaluate(() => {
      const button = document.getElementById('btnSelectNum');
      if (button) button.click();
    });

    // 구매 버튼이 나타날 때까지 대기
    await frame.waitForSelector('#btnBuy', { timeout: 10000 });

    // 구매 버튼 클릭 (JavaScript 평가 사용)
    await frame.evaluate(() => {
      const button = document.getElementById('btnBuy');
      if (button) button.click();
    });

    // 확인 대화 상자 대기
    await frame.waitForSelector('input[type="button"][value="확인"]', { timeout: 10000 });

    // 확인 버튼 클릭
    await frame.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('input[type="button"][value="확인"]'));
      const filteredButtons = buttons.filter((button) => button.id !== 'btnSelectNum');

      this._logger.log('필터링된 확인 버튼 수:', filteredButtons.length);

      if (filteredButtons.length > 0) {
        this._logger.log('확인 버튼 클릭 (btnSelectNum 제외)');
        const button = filteredButtons[0] as HTMLElement;
        button.click();
        return true;
      }

      this._logger.log('적절한 확인 버튼을 찾을 수 없음');
      return false;
    });

    // 첫 번째 확인 대화 상자 대기 (구매하시겠습니까?)
    try {
      // 팝업이 나타날 때까지 대기
      await frame.waitForSelector('.layer-message:has-text("구매하시겠습니까?")', { timeout: 10000 });

      // "확인" 버튼 클릭
      await frame.evaluate(() => {
        const confirmButtons = document.querySelectorAll('input[type="button"][value="확인"]');
        // 여러 확인 버튼 중 closepopupLayerConfirm(true) 함수를 호출하는 버튼 찾기
        for (let i = 0; i < confirmButtons.length; i++) {
          const button = confirmButtons[i] as HTMLElement;
          if (button.getAttribute('onclick')?.includes('closepopupLayerConfirm(true)')) {
            button.click();
            break;
          }
        }
      });

      // 클릭 후 잠시 대기
      await frame.waitForTimeout(1000);
    } catch (error) {
      console.error('첫 번째 확인 팝업 처리 중 오류 발생:', error);
    }

    let extractedNumbers: number[] = [];
    try {
      // reportRow 팝업이 나타날 때까지 대기
      await frame.waitForSelector('#reportRow', { timeout: 10000 });

      // 자동번호 추출
      extractedNumbers = await frame.evaluate(() => {
        const reportRow = document.getElementById('reportRow');
        if (!reportRow) return [];

        const numsDiv = reportRow.querySelector('.nums');
        if (!numsDiv) return [];

        const numberSpans = numsDiv.querySelectorAll('span');
        const numbers: number[] = [];

        numberSpans.forEach((span) => {
          const num = parseInt(span.textContent?.trim() || '0', 10);
          if (num > 0 && num <= 45) {
            numbers.push(num);
          }
        });

        return numbers;
      });

      this._logger.log('추출된 자동번호:', extractedNumbers);
    } catch (error) {
      console.error('번호 추출 중 오류 발생:', error);
    }

    // 필요한 경우 추가 닫기 버튼 처리
    try {
      await frame.waitForSelector('input[name="closeLayer"]', { timeout: 5000 });
      await frame.evaluate(() => {
        const closeButton = document.querySelector('input[name="closeLayer"]') as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      });
    } catch (error) {
      await frame.waitForSelector('#btnBuy', { timeout: 10000 });
      // 닫기 버튼이 없을 수 있으므로 오류 무시
      this._logger.log('닫기 버튼을 찾을 수 없거나 필요하지 않습니다.');
    }
    this._logger.log('로또 자동 구매가 완료되었습니다.');
    return { purchasedNumbers: [123], round: currentRound };
  }

  private _checkAgentStatus() {
    //TODO check is page is connected
    return this.browser && this.browser.isConnected();
  }

  private async getCurrentRound(frame: Frame): Promise<number> {
    try {
      // curRound 요소가 나타날 때까지 대기
      await frame.waitForSelector('#curRound', { timeout: 10000 });

      const currentRound = await frame.evaluate(() => {
        const curRound = document.getElementById('curRound');
        this._logger.log('curRound element:', curRound);
        this._logger.log('curRound textContent:', curRound?.textContent);

        if (curRound && curRound.textContent) {
          const roundNumber = Number(curRound.textContent.trim());
          this._logger.log('Parsed round number:', roundNumber);
          return roundNumber;
        }
        return 0;
      });

      this._logger.log('Current round from frame:', currentRound);

      return currentRound;
    } catch (error) {
      console.error('getCurrentRound 오류:', error);
      return 0;
    }
  }
}
