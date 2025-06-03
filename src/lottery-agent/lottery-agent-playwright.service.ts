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
        headless: true, // 브라우저 화면을 보려면 false로 설정,
        args: [
          '--disable-gpu',
          '--no-sandbox',
          '--single-process',
          '--disable-dev-shm-usage',
          '--no-zygote',
          '--disable-setuid-sandbox',
          '--disable-accelerated-2d-canvas',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-client-side-phishing-detection',
          '--disable-component-update',
          '--disable-default-apps',
          '--disable-domain-reliability',
          '--disable-features=AudioServiceOutOfProcess',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-renderer-backgrounding',
          '--disable-sync',
          '--force-color-profile=srgb',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-pings',
          '--use-gl=swiftshader',
          '--window-size=1280,1696',

          // 모바일 감지 방지를 위한 추가 옵션
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
        ],
      });
      this._logger.log('successfully launched Playwright browser');

      const context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        extraHTTPHeaders: {
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      this.page = await context.newPage();

      // // 🔥 핵심: 모바일 리다이렉트를 네트워크 레벨에서 차단
      await this.page.route('**/*', (route) => {
        const url = route.request().url();

        // 모바일 사이트로의 모든 요청을 데스크톱으로 변경
        if (url.includes('m.dhlottery.co.kr')) {
          const desktopUrl = url.replace('m.dhlottery.co.kr', 'www.dhlottery.co.kr');
          this._logger.log(`🔄 모바일 URL을 데스크톱으로 변경: ${url} -> ${desktopUrl}`);
          route.continue({ url: desktopUrl });
        } else {
          route.continue();
        }
      });

      // 🔥 JavaScript 리다이렉트 차단
      await this.page.addInitScript(() => {
        // 모든 location 변경을 차단
        const originalAssign = window.location.assign;
        const originalReplace = window.location.replace;

        window.location.assign = function (url: string) {
          if (typeof url === 'string' && url.includes('m.dhlottery.co.kr')) {
            console.log('🚫 모바일 리다이렉트 차단 (assign):', url);
            return;
          }
          return originalAssign.call(this, url);
        };

        window.location.replace = function (url: string) {
          if (typeof url === 'string' && url.includes('m.dhlottery.co.kr')) {
            console.log('🚫 모바일 리다이렉트 차단 (replace):', url);
            return;
          }
          return originalReplace.call(this, url);
        };

        // href 설정 차단
        let originalHref = window.location.href;
        try {
          Object.defineProperty(window.location, 'href', {
            get: function () {
              return originalHref;
            },
            set: function (url: string) {
              if (typeof url === 'string' && url.includes('m.dhlottery.co.kr')) {
                console.log('🚫 모바일 리다이렉트 차단 (href):', url);
                return;
              }
              originalHref = url;
              window.location.assign(url);
            },
            configurable: true,
          });
        } catch (e) {
          console.log('href 차단 설정 실패:', e);
        }

        // 모바일 감지 변수들 조작
        try {
          Object.defineProperty(navigator, 'userAgent', {
            get: () => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            configurable: true,
          });
        } catch (e) {}

        try {
          Object.defineProperty(navigator, 'platform', {
            get: () => 'Win32',
            configurable: true,
          });
        } catch (e) {}

        try {
          Object.defineProperty(navigator, 'maxTouchPoints', {
            get: () => 0,
            configurable: true,
          });
        } catch (e) {}

        try {
          Object.defineProperty(screen, 'width', {
            get: () => 1920,
            configurable: true,
          });
        } catch (e) {}

        try {
          Object.defineProperty(screen, 'height', {
            get: () => 1080,
            configurable: true,
          });
        } catch (e) {}

        // 터치 이벤트 지원 제거 (안전한 방법)
        try {
          (window as any).TouchEvent = undefined;
          (window as any).ontouchstart = undefined;
          (window as any).ontouchend = undefined;
          (window as any).ontouchmove = undefined;
        } catch (e) {
          // 무시
        }

        // 미디어 쿼리 조작
        if (window.matchMedia) {
          const originalMatchMedia = window.matchMedia;
          try {
            window.matchMedia = function (query: string): MediaQueryList {
              if (query.toLowerCase().includes('max-width') || query.toLowerCase().includes('mobile') || query.toLowerCase().includes('touch')) {
                // 완전한 MediaQueryList 객체 모킹
                return {
                  matches: false,
                  media: query,
                  onchange: null,
                  addListener: () => {},
                  removeListener: () => {},
                  addEventListener: () => {},
                  removeEventListener: () => {},
                  dispatchEvent: () => false,
                } as MediaQueryList;
              }
              return originalMatchMedia.call(window, query);
            };
          } catch (e) {
            console.log('matchMedia 설정 실패:', e);
          }
        }
      });

      this._logger.log('모바일 리다이렉트 차단 설정 완료');
    }
  }

  public async login(request: { id: string; password: string }): Promise<void> {
    await this.initialize();

    const loginPageUrl = `${this._baseUrl}/user.do?method=login&returnUrl=`;
    const { id, password } = request;

    this._logger.log('동행복권 로그인 페이지로 이동 중...');

    const response = await this.page.goto(loginPageUrl, {
      waitUntil: 'domcontentloaded',
    });
    this._logger.log(`response status: ${response?.status()}`);
    this._logger.log(`login final URL: ${this.page.url()}`);

    await this.page.fill('#userId', id);
    await this.page.fill('input[type="password"]', password);

    // 로그인 버튼 클릭
    // this.page.on('dialog', async (dialog) => {
    //   .log('Alert 메시지:', dialog.message());
    //   await dialog.accept(); // 또는 dialog.dismiss()
    // });
    await this.page.click('.btn_common.lrg.blu', { clickCount: 1 });

    // 로그인 성공 확인
    try {
      // 5초 동안 로그인 성공 여부 확인
      await this.page.waitForSelector('ul.information', { timeout: 5000 });

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

    this._logger.log(page.url());
    const roundText = await page.evaluate(() => {
      const element = document.querySelector('.win_result strong');
      return element?.textContent || '';
    });
    this._logger.log(page.isClosed());
    this._logger.log(roundText);
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

    this._logger.log(`접속 시도할 URL: ${url}`);

    // 1차 시도: 일반적인 방법
    let response = await this.page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    this._logger.log(`1차 응답: ${response?.status()}`);
    this._logger.log(`1차 최종 URL: ${this.page.url()}`);

    if (this.page.url().includes('m.dhlottery.co.kr')) {
      this._logger.warn('모바일 사이트로 리다이렉트됨. 강제로 데스크톱 사이트로 이동합니다.');

      // 강제로 데스크톱 사이트 접속 시도
      await this._forceDesktopSite();

      response = await this.page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      this._logger.log(`2차 응답: ${response?.status()}`);
      this._logger.log(`2차 최종 URL: ${this.page.url()}`);

      // 여전히 모바일이라면 쿠키와 로컬스토리지 클리어 후 재시도
      if (this.page.url().includes('m.dhlottery.co.kr')) {
        this._logger.warn('여전히 모바일 사이트입니다. 쿠키를 클리어하고 재시도합니다.');

        await this.page.context().clearCookies();
        await this.page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });

        await this._forceDesktopSite();

        response = await this.page.goto(url, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        this._logger.log(`3차 응답: ${response?.status()}`);
        this._logger.log(`3차 최종 URL: ${this.page.url()}`);
      }
    }

    if (!response || !response.ok()) {
      throw new Error(`로또 번호 조회 페이지로 이동 실패: ${response?.status()}`);
    }

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
        this._logger.error(`번호 ${num} 선택 중 오류 발생:`, error);
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
      this._logger.error('첫 번째 확인 팝업 처리 중 오류 발생:', error);
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

      if (filteredButtons.length > 0) {
        const button = filteredButtons[0] as HTMLElement;
        button.click();
        return true;
      }

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
      this._logger.error('첫 번째 확인 팝업 처리 중 오류 발생:', error);
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
      this._logger.error('번호 추출 중 오류 발생:', error);
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
    return { purchasedNumbers: extractedNumbers, round: currentRound };
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

        if (curRound && curRound.textContent) {
          const roundNumber = Number(curRound.textContent.trim());

          return roundNumber;
        }
        return 0;
      });

      this._logger.log('Current round from frame:', currentRound);

      return currentRound;
    } catch (error) {
      this._logger.error('getCurrentRound 오류:', error);
      return 0;
    }
  }

  private async _forceDesktopSite(): Promise<void> {
    // 데스크톱 사이트 강제 접속을 위한 추가 조치
    this._logger.log('데스크톱 사이트 강제 접속 시도...');

    // 새로운 컨텍스트로 재시도
    await this.page.setViewportSize({ width: 1920, height: 1080 });

    // 쿠키에 데스크톱 선호 설정 추가
    await this.page.context().addCookies([
      {
        name: 'device_type',
        value: 'desktop',
        domain: '.dhlottery.co.kr',
        path: '/',
      },
      {
        name: 'mobile_redirect',
        value: 'false',
        domain: '.dhlottery.co.kr',
        path: '/',
      },
    ]);

    // JavaScript로 추가 설정
    await this.page.evaluate(() => {
      // 로컬스토리지에 데스크톱 선호 설정
      if (typeof Storage !== 'undefined') {
        localStorage.setItem('preferred_site', 'desktop');
        localStorage.setItem('force_desktop', 'true');
        sessionStorage.setItem('device_type', 'desktop');
      }

      // 추가적인 모바일 감지 변수들 조작
      if (window.navigator) {
        Object.defineProperty(window.navigator, 'userAgentData', {
          get: () => ({
            mobile: false,
            platform: 'Windows',
          }),
        });
      }
    });

    await this.page.waitForTimeout(1000);
  }
}
