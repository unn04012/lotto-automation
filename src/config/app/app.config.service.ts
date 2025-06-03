import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

enum EnvironmentEnum {
  LOCAL = 'LOCAL',
  PROD = 'PROD',
}
export type EnvironmentType = keyof typeof EnvironmentEnum;

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get apiKey() {
    return this.configService.get('app.apiKey');
  }

  get httpPort() {
    return Number(this.configService.get('app.httpPort'));
  }

  get apiHeaderKey() {
    return this.configService.get('app.apiHeaderKey');
  }

  get env(): EnvironmentType {
    return this.configService.get('app.environment') as EnvironmentType;
  }
}
