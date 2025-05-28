import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app/app.config.service';
import { ApiKeyGuard } from './guard/api-key.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(AppConfigService);

  app.useGlobalGuards(new ApiKeyGuard(config));

  await app.listen(config.httpPort, () => {
    console.log(`Application is running on port: ${config.httpPort}`);
  });
}
bootstrap();
