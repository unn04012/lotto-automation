import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DynamoDBConfigService {
  constructor(private readonly _configService: ConfigService) {}

  get region() {
    return this._configService.get('dynamodb.region');
  }

  get endpoint() {
    return this._configService.get('dynamodb.endpoint');
  }
}
