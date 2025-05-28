import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AppConfigService } from 'src/config/app/app.config.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly _appConfigService: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) throw new UnauthorizedException('API Key is required');

    const validApiKey = this._appConfigService.apiKey;

    if (apiKey !== validApiKey) throw new UnauthorizedException('Invalid API Key');

    return true;
  }

  private extractApiKey(request: any): string | null {
    const headerKey = request.headers[this._appConfigService.apiHeaderKey];

    return headerKey;
  }
}
