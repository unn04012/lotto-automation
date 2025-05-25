import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DynamoDBConfigService {
  private readonly _dynamoDBClient: DynamoDBClient;

  constructor(private readonly _configService: ConfigService) {}

  get region() {
    return this._configService.get('dynamodb.region');
  }

  get endpoint() {
    return this._configService.get('dynamodb.endpoint');
  }

  get client() {
    const client = new DynamoDBClient({
      region: this.region,
      endpoint: this.endpoint,
    });

    return client;
  }
}
