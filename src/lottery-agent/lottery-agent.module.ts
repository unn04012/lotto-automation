import { Module } from '@nestjs/common';
import { LotteryAgentBaseService } from './lottery-agent-base.service';
import { LotteryAgentPlayWrightService } from './lottery-agent-playwright.service';
import { LottoConfigModule } from 'src/config/lotto/lotto-config.module';

@Module({
  imports: [LottoConfigModule],
  controllers: [],
  providers: [
    {
      provide: LotteryAgentBaseService,
      useClass: LotteryAgentPlayWrightService,
    },
  ],
})
export class LotteryAgentModule {}
