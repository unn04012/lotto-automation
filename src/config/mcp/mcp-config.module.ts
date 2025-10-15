import { Module } from '@nestjs/common';
import { AppConfigModule } from '../app/app.config.module';
import { McpConfigService } from './mcp-config.service';

@Module({
  imports: [AppConfigModule],
  providers: [McpConfigService],
  exports: [McpConfigService],
})
export class McpConfigModule {}
