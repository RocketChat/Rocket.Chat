import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { SHADOW_CONFIG, type ShadowConfig } from './config/shadow.config.js';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  app.enableShutdownHooks();
  await app.listen(app.get<ShadowConfig>(SHADOW_CONFIG).port);
}
await bootstrap();
