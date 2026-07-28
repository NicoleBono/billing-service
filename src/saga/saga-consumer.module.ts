import { Module } from '@nestjs/common';
import { BudgetsModule } from '../budgets/budgets.module';
import { PaymentsModule } from '../payments/payments.module';
import { SagaConsumerService } from './consumer/saga-consumer.service';
import { SAGA_EVENT_HANDLER } from './handlers/saga-event-handler.interface';
import { OsCreatedHandler } from './handlers/os-created.handler';
import { AdditionalRequestedHandler } from './handlers/additional-requested.handler';
import { BudgetApprovalDecidedHandler } from './handlers/budget-approval-decided.handler';

@Module({
  imports: [BudgetsModule, PaymentsModule],
  providers: [
    SagaConsumerService,
    OsCreatedHandler,
    AdditionalRequestedHandler,
    BudgetApprovalDecidedHandler,
    {
      provide: SAGA_EVENT_HANDLER,
      useFactory: (
        osCreated: OsCreatedHandler,
        additionalRequested: AdditionalRequestedHandler,
        budgetApprovalDecided: BudgetApprovalDecidedHandler,
      ) => [osCreated, additionalRequested, budgetApprovalDecided],
      inject: [OsCreatedHandler, AdditionalRequestedHandler, BudgetApprovalDecidedHandler],
    },
  ],
})
export class SagaConsumerModule {}
