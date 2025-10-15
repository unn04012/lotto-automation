import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { McpConfigModule } from 'src/config/mcp/mcp-config.module';
import { McpConfigService } from 'src/config/mcp/mcp-config.service';

import { LottoModule } from 'src/lotto/lotto.module';
import { McpHttpStreamableController } from './mcp-http-streamable.controller';
import { AppConfigModule } from 'src/config/app/app.config.module';

@Module({
  imports: [
    McpModule.forRootAsync({
      imports: [McpConfigModule],
      useFactory: (config: McpConfigService) => {
        return config.mcpOption;
      },
      inject: [McpConfigService],
    }),
    LottoModule,
    AppConfigModule,
  ],
  controllers: [McpHttpStreamableController],
})
export class LottoMcpModule {}
