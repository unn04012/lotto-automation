import { Injectable } from '@nestjs/common';
import { LottoConfigService } from 'src/config/lotto/lotto-config.service';
import { EncryptionService } from 'src/encryption/encryption.service';

@Injectable()
export class UserService {
  constructor(
    private readonly lottoConfigService: LottoConfigService,
    private readonly _encryptionService: EncryptionService,
  ) {}

  public async getUserCredentials() {
    const { id, password } = this.lottoConfigService;

    return { id, password: this._encryptionService.decrypt(password) };
  }
}
