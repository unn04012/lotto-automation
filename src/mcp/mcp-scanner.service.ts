// mcp/services/mcp-scanner.service.ts
import { Injectable, Type } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { McpResourceMetadata, McpToolMetadata } from './types/mcp.types';
import { MCP_CONTROLLER_METADATA, MCP_RESOURCE_METADATA, MCP_TOOL_METADATA } from './constants/mcp.constants';

@Injectable()
export class McpScannerService {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  /**
   * 모든 MCP Tool 메타데이터 스캔
   */
  scanForTools(): McpToolMetadata[] {
    const tools: McpToolMetadata[] = [];
    const controllers = this.getMcpControllers();

    controllers.forEach((wrapper) => {
      const { instance } = wrapper;
      if (!instance) return;

      const prototype = Object.getPrototypeOf(instance);
      const toolsMetadata = this.reflector.get(MCP_TOOL_METADATA, prototype.constructor) || [];

      toolsMetadata.forEach((tool: McpToolMetadata) => {
        tools.push({
          ...tool,
          target: instance,
        });
      });
    });

    return tools;
  }

  /**
   * 모든 MCP Resource 메타데이터 스캔
   */
  scanForResources(): McpResourceMetadata[] {
    const resources: McpResourceMetadata[] = [];
    const controllers = this.getMcpControllers();

    controllers.forEach((wrapper) => {
      const { instance } = wrapper;
      if (!instance) return;

      const prototype = Object.getPrototypeOf(instance);
      const resourcesMetadata = this.reflector.get(MCP_RESOURCE_METADATA, prototype.constructor) || [];

      resourcesMetadata.forEach((resource: McpResourceMetadata) => {
        resources.push({
          ...resource,
          target: instance,
        });
      });
    });

    return resources;
  }

  /**
   * MCP Controller들 찾기
   */
  private getMcpControllers(): InstanceWrapper[] {
    const controllers = this.discoveryService.getControllers();
    return controllers.filter((wrapper) => {
      const { metatype } = wrapper;
      if (!metatype) return false;

      return this.reflector.get(MCP_CONTROLLER_METADATA, metatype);
    });
  }
}
