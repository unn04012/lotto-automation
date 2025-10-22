import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from '../app/app.config.service';

@Injectable()
export class PlayWrightConfigService {
  constructor(
    private readonly _configService: ConfigService,
    private readonly _appConfigService: AppConfigService,
  ) {}

  get headless() {
    return this._configService.get('playwright.headless');
  }

  get launchOptions() {
    const env = this._appConfigService.env;

    if (env === 'LOCAL') {
      return [];
    } else {
      return [
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
        // // 모바일 감지 방지를 위한 추가 옵션
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
      ];
    }
  }
}
