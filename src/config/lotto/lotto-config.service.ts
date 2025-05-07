import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LottoConfigService {
  constructor(private readonly _configService: ConfigService) {}

  get id() {
    return this._configService.get('lotto.id');
  }

  get password() {
    return this._configService.get('lotto.password');
  }
}
