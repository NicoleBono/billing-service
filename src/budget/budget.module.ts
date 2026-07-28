import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { SagaPublisherModule } from '../saga/saga-publisher.module';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';

@Module({
  imports: [SagaPublisherModule, MercadoPagoModule],
  providers: [BudgetService],
  controllers: [BudgetController],
  exports: [BudgetService],
})
export class BudgetModule {}
