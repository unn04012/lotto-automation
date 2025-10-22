import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

// Validation schemas
import { lottoValidationSchema } from './lotto/lotto.validation';
import { dynamodbValidationSchema } from './dynamodb/dynamodb.validation';
import { slackValidationSchema } from './slack/slack.validation';
import { encryptValidationSchema } from './encrypt/encrypt.validation';
import { appValidationSchema } from './app/app.validation';

// Configuration loaders
import lottoConfiguration from './lotto/lotto-configuration';
import dynamodbConfiguration from './dynamodb/dynamodb-configuration';
import { registerAs } from '@nestjs/config';

// Config services
import { LottoConfigService } from './lotto/lotto-config.service';
import { DynamoDBConfigService } from './dynamodb/dynamodb-config.service';
import { SlackConfigService } from './slack/slack.config.service';
import { EncryptConfigService } from './encrypt/encrypt.config.service';
import { AppConfigService } from './app/app.config.service';
import { McpConfigService } from './mcp/mcp-config.service';
import { PlayWrightConfigService } from './playwright/playwright-config.service';
import { playwrightValidationSchema } from './playwright/playwright-validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        lottoConfiguration,
        dynamodbConfiguration,
        registerAs('slack', () => ({
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
        })),
        registerAs('encrypt', () => ({
          key: process.env.ENCRYPTION_KEY,
          algorithm: process.env.ENCRYPTION_ALGORITHM,
        })),
        registerAs('app', () => ({
          apiKey: process.env.API_KEY,
          httpPort: process.env.HTTP_PORT,
          apiHeaderKey: process.env.API_HEADER_KEY,
          environment: process.env.ENVIRONMENT,
        })),
        registerAs('playwright', () => ({
          headless: process.env.HEADLESS,
        })),
      ],
      validationSchema: Joi.object()
        .concat(lottoValidationSchema)
        .concat(dynamodbValidationSchema)
        .concat(slackValidationSchema)
        .concat(encryptValidationSchema)
        .concat(appValidationSchema)
        .concat(playwrightValidationSchema),
    }),
  ],
  providers: [LottoConfigService, DynamoDBConfigService, SlackConfigService, EncryptConfigService, AppConfigService, McpConfigService, PlayWrightConfigService],
  exports: [LottoConfigService, DynamoDBConfigService, SlackConfigService, EncryptConfigService, AppConfigService, McpConfigService, PlayWrightConfigService],
})
export class LottoAutomationConfigModule {}
