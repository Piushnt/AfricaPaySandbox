import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  app.setGlobalPrefix('v1', { exclude: ['health'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  const swagger = new DocumentBuilder().setTitle('Payment Sandbox Africa API').setDescription('API de simulation uniquement — aucun fonds réel ne circule.').setVersion('1.0.0').addApiKey({ type: 'apiKey', in: 'header', name: 'X-API-Key' }, 'test-key').build();
  SwaggerModule.setup('api-docs', app, SwaggerModule.createDocument(app, swagger));
  const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`Sandbox API listening on ${port}`);
}
void bootstrap();
