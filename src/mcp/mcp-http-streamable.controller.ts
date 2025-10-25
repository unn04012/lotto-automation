import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { McpStreamableHttpService } from '@rekog/mcp-nest';
import { ApiKeyGuard } from 'src/guard/api-key.guard';

@Controller('/prod')
@UseGuards(ApiKeyGuard)
export class McpHttpStreamableController {
  constructor(private readonly mcpStreamableHttpService: McpStreamableHttpService) {}

  @Post('/mcp')
  async handlePostRequest(@Req() req: any, @Res() res: any, @Body() body: unknown): Promise<void> {
    await this.mcpStreamableHttpService.handlePostRequest(req, res, body);
  }

  @Get('/mcp')
  async handleGetRequest(@Req() req: any, @Res() res: any): Promise<void> {
    await this.mcpStreamableHttpService.handleGetRequest(req, res);
  }

  // additional endpoints ...
}
