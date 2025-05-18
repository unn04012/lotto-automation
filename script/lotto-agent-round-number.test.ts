import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src//app.module';
import { LottoConfigService } from 'src/config/lotto/lotto-config.service';
import { Symbols } from 'src/symbols';
import { ILotteryAgentService } from 'src/lottery-agent/lottery-agent.service.interface';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: true,
  });

  return app;
}

(async () => {
  const app = await bootstrap();

  const lottoAgent = app.get<ILotteryAgentService>(Symbols.lotteryAgent);
  const config = app.get(LottoConfigService);

  await lottoAgent.initialize();
  await lottoAgent.login(config);

  const lottoNumbers = [3, 17, 2, 12, 44, 19, 35];
  await lottoAgent.buyLottery(lottoNumbers);

  process.exit(0);
})();
