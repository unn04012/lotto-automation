import { Module } from '@nestjs/common';
import { LotteryAgentModule } from './lottery-agent/lottery-agent.module';
import { ConfigModule } from '@nestjs/config';
import { LottoModule } from './lotto/lotto.module';
import { NotificationModule } from './notification/notificaiton.module';
import { EncryptionModule } from './encryption/encryption.module';
import { AppConfigModule } from './config/app/app.config.module';
import { LottoMcpModule } from './mcp/mcp.module';
import { LottoConfigModule } from './config/lotto/lotto-config.module';

@Module({
  imports: [LottoConfigModule, LotteryAgentModule, LottoModule, NotificationModule, EncryptionModule, AppConfigModule, LottoMcpModule],
})
export class AppModule {}
