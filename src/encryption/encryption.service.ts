import * as AES from 'crypto-js/aes';
import * as EncUtf8 from 'crypto-js/enc-utf8';
import { Injectable } from '@nestjs/common';
import { EncryptConfigService } from 'src/config/encrypt/encrypt.config.service';

@Injectable()
export class EncryptionService {
  private readonly _key: string;

  constructor(private readonly _encryptConfigService: EncryptConfigService) {
    this._key = this._encryptConfigService.encryptionKey;
  }

  public encrypt(text: string) {
    return AES.encrypt(text, this._key).toString();
  }

  public decrypt(encryptedData: string) {
    const bytes = AES.decrypt(encryptedData, this._key);

    return bytes.toString(EncUtf8);
  }
}
