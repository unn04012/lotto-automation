import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LotteryAgentModule } from './lottery-agent/lottery-agent.module';
import { ConfigModule } from '@nestjs/config';
import { LottoModule } from './lotto/lotto.module';

@Module({
  imports: [ConfigModule, LotteryAgentModule, LottoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
