import { Module } from '@nestjs/common';
import { SlackConfigModule } from 'src/config/slack/slack.config.module';
import { NotificationSlackService } from './notificaiton-slack.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [SlackConfigModule, HttpModule],
  providers: [NotificationSlackService],
  exports: [NotificationSlackService],
})
export class NotificationModule {}
