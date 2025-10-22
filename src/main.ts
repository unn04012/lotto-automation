import { NestFactory } from '@nestjs/core';

import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app/app.config.service';
import { ApiKeyGuard } from './guard/api-key.guard';
import { GlobalExceptionFilter } from './filter/exception.filter';
import { NotificationSlackService } from './notification/notificaiton-slack.service';
import { ConsoleLogger } from '@nestjs/common';

const serverlessExpress = require('@codegenie/serverless-express');

let server: Handler;

async function bootstrap(): Promise<Handler | void> {
  const app = await NestFactory.create(AppModule);

  const config = app.get(AppConfigService);

  const logger = new ConsoleLogger({ json: true, colors: config.env === 'LOCAL' });
  // app.useGlobalGuards(new ApiKeyGuard(config));

  const notificationService = app.get(NotificationSlackService);
  app.useGlobalFilters(new GlobalExceptionFilter(notificationService));

  await app.init();

  if (config.env === 'LOCAL') {
    await app.listen(config.httpPort);
    logger.log(`Server is running on http://localhost:${config.httpPort}`);
    return;
  } else {
    const expressApp = app.getHttpAdapter().getInstance();

    return serverlessExpress({ app: expressApp });
  }
}

if (process.env.ENVIRONMENT === 'LOCAL') {
  bootstrap();
}

export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
