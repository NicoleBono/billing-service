import { Module } from '@nestjs/common';
import { SagaPublisherService } from './publisher/saga-publisher.service';

// Módulo isolado (sem dependências) para evitar import circular entre
// BudgetsModule/PaymentsModule (publicam eventos) e SagaConsumerModule
// (consome eventos e depende deles para aplicar as transições de estado).
@Module({
  providers: [SagaPublisherService],
  exports: [SagaPublisherService],
})
export class SagaPublisherModule {}
