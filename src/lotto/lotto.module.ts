import { Module } from '@nestjs/common';
import { LottoService } from './lotto.service';
import { UserLottoRepositoryDynamoDB } from './repository/user-lotto-repository-dynamoDB';
import { Symbols } from 'src/symbols';
import { LotteryAgentModule } from 'src/lottery-agent/lottery-agent.module';
import { UserService } from 'src/user/user.service';
import { LottoConfigModule } from 'src/config/lotto/lotto-config.module';
import { DynamoDBConfigModule } from 'src/config/dynamodb/dynamodb-config.module';
import { LottoController } from './lotto.controller';
import { NotificationModule } from 'src/notification/notificaiton.module';
import { EncryptionModule } from 'src/encryption/encryption.module';
import { LottoMCPToolController } from './lotto-mcp-tool.controller';
import { LottoMCPResourceController } from './lotto-mcp-resource.controller';

@Module({
  imports: [LottoConfigModule, DynamoDBConfigModule, LotteryAgentModule, NotificationModule, EncryptionModule],
  controllers: [LottoController, LottoMCPToolController, LottoMCPResourceController],
  providers: [
    UserService,
    LottoService,
    {
      useClass: UserLottoRepositoryDynamoDB,
      provide: Symbols.userLottoRepository,
    },
  ],
  exports: [],
})
export class LottoModule {}
