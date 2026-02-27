import './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global prefix
  const prefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(prefix);

  // CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Pide API')
    .setDescription(
      'API de la plataforma de delivery Pide - Similar a Rappi, operando en Colombia',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication & Authorization')
    .addTag('Users', 'User management & profiles')
    .addTag('Restaurants', 'Restaurant CRUD & management')
    .addTag('Menus', 'Menu categories & items')
    .addTag('Orders', 'Order lifecycle management')
    .addTag('Drivers', 'Driver profiles & location')
    .addTag('Notifications', 'Push notifications')
    .addTag('Coupons', 'Coupon management & validation')
    .addTag('Reviews', 'Ratings & reviews')
    .addTag('Uploads', 'File upload to R2')
    .addTag('Admin', 'Admin-only endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.APP_PORT || process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Pide Backend running on http://0.0.0.0:${port}`);
  logger.log(`📚 Swagger docs at http://0.0.0.0:${port}/docs`);
  logger.log(`🔌 API prefix: /${prefix}`);
}

bootstrap();
