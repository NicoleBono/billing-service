import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { EventsModule } from '../events/events.module';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';

@Module({
  imports: [EventsModule, MercadoPagoModule],
  providers: [BudgetService],
  controllers: [BudgetController],
  exports: [BudgetService],
})
export class BudgetModule {}
