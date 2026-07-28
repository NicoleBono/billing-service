import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentDocument, PaymentSchema } from './infra/mongo/payment.schema';
import { PaymentMongoRepository } from './infra/mongo/payment.mongo.repository';
import { PaymentRepository } from './domain/repositories/payment.repository';
import { MercadoPagoClient } from './infra/mercadopago/mercadopago.client';
import { PaymentsController } from './infra/controllers/payments.controller';
import { CreatePaymentUseCase } from './application/use-cases/create-payment.use-case';
import { HandleMercadoPagoWebhookUseCase } from './application/use-cases/handle-mercadopago-webhook.use-case';
import { FindPaymentByWorkOrderUseCase } from './application/use-cases/find-payment-by-work-order.use-case';
import { SagaPublisherModule } from '../saga/saga-publisher.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: PaymentDocument.name, schema: PaymentSchema }]), SagaPublisherModule],
  controllers: [PaymentsController],
  providers: [
    MercadoPagoClient,
    CreatePaymentUseCase,
    HandleMercadoPagoWebhookUseCase,
    FindPaymentByWorkOrderUseCase,
    PaymentMongoRepository,
    { provide: PaymentRepository, useExisting: PaymentMongoRepository },
  ],
  exports: [PaymentRepository, CreatePaymentUseCase],
})
export class PaymentsModule {}
