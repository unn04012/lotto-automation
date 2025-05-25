import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import configuration from './dynamodb-configuration';
import { DynamoDBConfigService } from './dynamodb-config.service';

/**
 * Import and provide app configuration related classes.
 *
 * @module
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: '.env',
      validationSchema: Joi.object({
        DYNAMODB_REGION: Joi.string().required(),
        DYNAMODB_ENDPOINT: Joi.string().required(),
      }),
    }),
  ],
  providers: [DynamoDBConfigService],
  exports: [DynamoDBConfigService],
})
export class DynamoDBConfigModule {}
