import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LotteryAgentModule } from './lottery-agent/lottery-agent.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, LotteryAgentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
