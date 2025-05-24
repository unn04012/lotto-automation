import { Injectable } from '@nestjs/common';
import { LottoConfigService } from 'src/config/lotto/lotto-config.service';

@Injectable()
export class UserService {
  constructor(private readonly lottoConfigService: LottoConfigService) {}

  public async getUserCredentials() {
    const { id, password } = this.lottoConfigService;

    return { id, password };
  }
}
