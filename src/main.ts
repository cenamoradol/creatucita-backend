import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Los GET con datos autenticados no deben cachearse (el navegador servia
  // respuestas viejas, p.ej. el contador de mensajes sin leer).
  app.use((req: any, res: any, next: () => void) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('CreaTuCita API')
    .setDescription(
      'Nueva API para la gestión de citas con NestJS y PostgreSQL',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3002);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT || 3002}`,
  );
  console.log(
    `Swagger documentation: http://localhost:${process.env.PORT || 3002}/api/docs`,
  );
}
bootstrap();
