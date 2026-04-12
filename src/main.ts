import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Provecho! API')
    .setDescription('Provecho! API - Desarrollo de Aplicaciones')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      supportedSubmitMethods: [], // Deshabilita probar la API desde Swagger UI
    },
  });

  await app.listen(process.env.PORT ?? 8080);

  console.log(`Application is running on: ${await app.getUrl()}`);
}

void bootstrap();
