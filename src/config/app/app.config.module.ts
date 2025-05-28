import { Module } from '@nestjs/common';
import { ConfigModule, registerAs } from '@nestjs/config';
import * as Joi from 'joi';
import { AppConfigService } from './app.config.service';

/**
 * Import and provide app configuration related classes.
 *
 * @module
 */

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        registerAs('app', () => ({
          apiKey: process.env.API_KEY,
          httpPort: process.env.HTTP_PORT,
          apiHeaderKey: process.env.API_HEADER_KEY,
        })),
      ],
      envFilePath: '.env',
      validationSchema: Joi.object({
        API_KEY: Joi.string().required(),
        HTTP_PORT: Joi.number().required(),
        API_HEADER_KEY: Joi.string().required(),
      }),
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
