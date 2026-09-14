import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { GlobalValidationPipe } from './common/pipes/validation.pipe.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new GlobalValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
