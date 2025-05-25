import { Module } from '@nestjs/common';
import { LotteryAgentPlayWrightService } from './lottery-agent-playwright.service';
import { LottoConfigModule } from 'src/config/lotto/lotto-config.module';
import { Symbols } from 'src/symbols';

@Module({
  imports: [LottoConfigModule],
  controllers: [],
  providers: [
    {
      provide: Symbols.lotteryAgent,
      useClass: LotteryAgentPlayWrightService,
    },
  ],
  exports: [Symbols.lotteryAgent],
})
export class LotteryAgentModule {}
