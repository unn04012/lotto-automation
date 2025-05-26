import { Module } from '@nestjs/common';
import { ConfigModule, registerAs } from '@nestjs/config';
import * as Joi from 'joi';
import { SlackConfigService } from './slack.config.service';

/**
 * Import and provide app configuration related classes.
 *
 * @module
 */

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        registerAs('slack', () => ({
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
        })),
      ],
      envFilePath: '.env',
      validationSchema: Joi.object({
        SLACK_WEBHOOK_URL: Joi.string().uri().required(),
      }),
    }),
  ],
  providers: [SlackConfigService],
  exports: [SlackConfigService],
})
export class SlackConfigModule {}
