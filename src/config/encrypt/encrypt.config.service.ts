import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptConfigService {
  constructor(private readonly configService: ConfigService) {}

  get encryptionKey() {
    return this.configService.get('encrypt.key');
  }

  get encryptionAlgorithm() {
    return this.configService.get('encrypt.algorithm');
  }
}
