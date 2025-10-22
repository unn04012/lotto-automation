import { SetMetadata } from '@nestjs/common';
import { MCP_CONTROLLER_METADATA } from '../constants/mcp.constants';

/**
 * MCP Controller 마커 데코레이터
 */
export function McpController(): ClassDecorator {
  return SetMetadata(MCP_CONTROLLER_METADATA, true);
}
