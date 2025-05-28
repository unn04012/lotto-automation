import { Module } from '@nestjs/common';
import { ConfigModule, registerAs } from '@nestjs/config';
import * as Joi from 'joi';
import { EncryptConfigService } from './encrypt.config.service';

/**
 * Import and provide app configuration related classes.
 *
 * @module
 */

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        registerAs('encrypt', () => ({
          key: process.env.ENCRYPTION_KEY,
          algorithm: process.env.ENCRYPTION_ALGORITHM,
        })),
      ],
      envFilePath: '.env',
      validationSchema: Joi.object({
        ENCRYPTION_KEY: Joi.string().required(),
        ENCRYPTION_ALGORITHM: Joi.string().required(),
      }),
    }),
  ],
  providers: [EncryptConfigService],
  exports: [EncryptConfigService],
})
export class EncryptionConfigModule {}
