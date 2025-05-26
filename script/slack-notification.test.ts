import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src//app.module';
import { NotificationSlackService } from 'src/notification/notificaiton-slack.service';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: true,
  });

  return app;
}

(async () => {
  const app = await bootstrap();

  const slack = app.get(NotificationSlackService);

  await slack.sendPurchaseCompletionNotification({
    game: '6/45',
    purchasedNumbers: [1, 23, 32, 4, 55, 6],
    purchasedDate: new Date(),
  });
  process.exit(0);
})();
