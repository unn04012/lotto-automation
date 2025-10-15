import { Injectable } from '@nestjs/common';
import { McpAsyncOptions } from '@rekog/mcp-nest';
import { AppConfigService } from '../app/app.config.service';

@Injectable()
export class McpConfigService {
  constructor(private readonly _appConfigService: AppConfigService) {}

  get mcpOption(): McpAsyncOptions {
    const options: McpAsyncOptions = {
      name: 'mcp',
      version: '1.0.0',
    };
    if (this._appConfigService.env === 'PROD') {
      options.streamableHttp = {
        enableJsonResponse: true,
        sessionIdGenerator: undefined,
        statelessMode: true, // No session management
      };
    }

    return options;
  }
}
