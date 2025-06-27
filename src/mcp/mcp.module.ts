// mcp/mcp.module.ts
import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { McpScannerService } from './mcp-scanner.service';
import { McpService } from './mcp.service';

@Module({
  imports: [DiscoveryModule],
  providers: [McpService, McpScannerService],
  exports: [McpService, McpScannerService],
})
export class McpModule {}
