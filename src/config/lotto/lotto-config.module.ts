import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { LottoConfigService } from './lotto-config.service';
import configuration from './lotto-configuration';

/**
 * Import and provide app configuration related classes.
 *
 * @module
 */

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: '.env',
      validationSchema: Joi.object({
        LOTTO_ID: Joi.string().required(),
        LOTTO_PASSWORD: Joi.string().required(),
      }),
    }),
  ],
  providers: [LottoConfigService],
  exports: [LottoConfigService],
})
export class LottoConfigModule {}
