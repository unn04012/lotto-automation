import { Module } from '@nestjs/common';
import { LottoConfigModule } from './lotto/lotto-config.module';
import { DynamoDBConfigModule } from './dynamodb/dynamodb-config.module';

@Module({
  imports: [LottoConfigModule, DynamoDBConfigModule],
  exports: [LottoConfigModule, DynamoDBConfigModule],
})
export class ConfigModule {}
