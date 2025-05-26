import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SlackConfigService {
  constructor(private readonly configService: ConfigService) {}

  get slackWebhookUrl() {
    return this.configService.get('slack.webhookUrl');
  }
}
