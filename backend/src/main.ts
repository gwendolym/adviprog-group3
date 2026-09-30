import { NestFactory } from '@nestjs/core';
import { config } from 'dotenv';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
config({ path: '../.env' });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  const port = process.env.BACKEND_PORT;
  if (!port) throw new Error('BACKEND_PORT is not set (see .env.example)');
  await app.listen(port);
}
await bootstrap();
