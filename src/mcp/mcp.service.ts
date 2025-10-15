// 완전한 mcp-server.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { McpScannerService } from './mcp-scanner.service';
import { McpResourceMetadata, McpToolMetadata } from './types/mcp.types';

@Injectable()
export class McpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(McpService.name);
  private server: Server;
  private transport: StdioServerTransport;
  private tools: McpToolMetadata[] = [];
  private resources: McpResourceMetadata[] = [];

  constructor(private readonly mcpScanner: McpScannerService) {}

  async onModuleInit() {
    this.tools = this.mcpScanner.scanForTools();
    this.resources = this.mcpScanner.scanForResources();

    this.server = new Server(
      {
        name: 'nestjs-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {}, // Resources 기능 활성화
          tools: {}, // Tools 기능 활성화
          prompts: {}, // Prompts 기능 활성화 (선택사항)
          logging: {}, // Logging 기능 활성화 (선택사항)
        },
      },
    );

    // 모든 핸들러 등록
    await this.registerHandlers();

    // 전송 계층 연결
    this.transport = new StdioServerTransport();
    await this.server.connect(this.transport);

    this.logger.log('MCP Server initialized successfully');
  }

  private async registerHandlers() {
    // Tools 리스트 핸들러
    this.server.setRequestHandler(z.object({ method: z.literal('tools/list') }), async () => ({
      tools: this.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    }));

    // Tool 실행 핸들러
    this.server.setRequestHandler(
      z.object({
        method: z.literal('tools/call'),
        params: z.object({
          name: z.string(),
          arguments: z.any().optional(),
        }),
      }),
      async (request) => {
        const toolName = request.params.name;
        const tool = this.tools.find((t) => t.name === toolName);

        if (!tool) {
          throw new Error(`Tool "${toolName}" not found`);
        }

        try {
          const result = await tool.target[tool.methodName](request.params.arguments);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          throw new Error(`Tool execution failed: ${error.message}`);
        }
      },
    );

    // Resources 리스트 핸들러
    this.server.setRequestHandler(z.object({ method: z.literal('resources/list') }), async () => ({
      resources: this.resources.map((resource) => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      })),
    }));

    // Resource 읽기 핸들러
    this.server.setRequestHandler(
      z.object({
        method: z.literal('resources/read'),
        params: z.object({
          uri: z.string(),
        }),
      }),
      async (request) => {
        const uri = request.params.uri;
        const resource = this.resources.find((r) => r.uri === uri);

        if (!resource) {
          throw new Error(`Resource "${uri}" not found`);
        }

        try {
          const content = await resource.target[resource.methodName](request.params);
          return {
            contents: [
              {
                uri: resource.uri,
                mimeType: resource.mimeType || 'text/plain',
                text: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
              },
            ],
          };
        } catch (error) {
          throw new Error(`Resource read failed: ${error.message}`);
        }
      },
    );
  }

  async onModuleDestroy() {
    if (this.server) {
      await this.server.close();
      this.logger.log('MCP Server closed');
    }
  }
}
