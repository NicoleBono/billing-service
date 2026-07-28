import './tracing';
import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('billing');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new DomainExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Billing Service - Tech Challenge Fase 4')
    .setDescription('Orçamentos e pagamentos (Mercado Pago) da oficina mecânica.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger/api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Billing Service: http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/swagger/api-docs`);
}
bootstrap();
