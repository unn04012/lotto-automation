import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import configuration from './dynamodb-configuration';
import { DynamoDBConfigService } from './dynamodb-config.service';
import { validationOptions } from '../config-common';

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
        DYNAMODB_REGION: Joi.string().required(),
        DYNAMODB_ENDPOINT: Joi.string().required(),
      }),
      validationOptions,
    }),
  ],
  providers: [DynamoDBConfigService],
  exports: [DynamoDBConfigService],
})
export class DynamoDBConfigModule {}
