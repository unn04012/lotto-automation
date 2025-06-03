import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { NotificationSlackService } from 'src/notification/notificaiton-slack.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly notificationService: NotificationSlackService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException ? exception.message : 'Internal server error';

    // 500 에러나 중요한 에러만 Slack 알림
    if (status >= 500) {
      this.sendErrorToSlack(exception, request);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }

  private async sendErrorToSlack(exception: unknown, request: Request): Promise<void> {
    try {
      const error = exception as Error;
      await this.notificationService.sendErrorNotification({
        service: 'GlobalExceptionFilter',
        method: `${request.method} ${request.url}`,
        message: error.message,
        stack: error.stack,
        context: {
          url: request.url,
          method: request.method,
          headers: request.headers,
          body: request.body,
          query: request.query,
          params: request.params,
        },
      });
    } catch (slackError) {
      console.error('Slack 알림 전송 실패:', slackError);
    }
  }
}
