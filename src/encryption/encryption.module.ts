import { Module } from '@nestjs/common';
import { EncryptionConfigModule } from 'src/config/encrypt/encrypt.config.module';
import { EncryptionService } from './encryption.service';

@Module({
  imports: [EncryptionConfigModule],
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
