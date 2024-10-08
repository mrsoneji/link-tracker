import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Asegúrate de que NestJS pueda manejar JSON correctamente
  app.useGlobalPipes(new ValidationPipe());
  // Configuración básica de Swagger
  const config = new DocumentBuilder()
    .setTitle('Link Tracker API')
    .setDescription('API para gestionar y trackear links enmascarados')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Swagger estará disponible en /api

  await app.listen(3000);
}
bootstrap();
