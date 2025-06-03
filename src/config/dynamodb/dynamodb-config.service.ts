import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from '../app/app.config.service';

@Injectable()
export class DynamoDBConfigService {
  private readonly _dynamoDBClient: DynamoDBClient;

  constructor(
    private readonly _configService: ConfigService,
    private readonly _appConfigService: AppConfigService,
  ) {
    this._dynamoDBClient = new DynamoDBClient({
      region: this.region,
      endpoint: this._appConfigService.env === 'PROD' ? undefined : this.endpoint,
    });
  }

  get region() {
    return this._configService.get('dynamodb.region');
  }

  get endpoint() {
    return this._configService.get('dynamodb.endpoint');
  }

  get client() {
    return this._dynamoDBClient;
  }
}
