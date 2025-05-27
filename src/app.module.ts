import { Module } from '@nestjs/common';
import { LotteryAgentModule } from './lottery-agent/lottery-agent.module';
import { ConfigModule } from '@nestjs/config';
import { LottoModule } from './lotto/lotto.module';
import { NotificationModule } from './notification/notificaiton.module';

@Module({
  imports: [ConfigModule, LotteryAgentModule, LottoModule, NotificationModule],
})
export class AppModule {}
