import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LottoConfigModule } from './config/lotto/lotto-config.module';
import { LotteryAgentModule } from './lottery-agent/lottery-agent.module';

@Module({
  imports: [LottoConfigModule, LotteryAgentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
