import { Module } from '@nestjs/common';
import { SagaConsumerService } from './consumer/saga-consumer.service';
import { SAGA_EVENT_HANDLER } from './handlers/saga-event-handler.interface';
import { OsCreatedHandler } from './handlers/os-created.handler';
import { BudgetApprovalDecidedHandler } from './handlers/budget-approval-decided.handler';
import { ExecutionCompletedHandler } from './handlers/execution-completed.handler';
import { SagaPublisherModule } from './saga-publisher.module';
import { BudgetModule } from '../budget/budget.module';

@Module({
  imports: [SagaPublisherModule, BudgetModule],
  providers: [
    OsCreatedHandler,
    BudgetApprovalDecidedHandler,
    ExecutionCompletedHandler,
    {
      provide: SAGA_EVENT_HANDLER,
      useFactory: (h1: OsCreatedHandler, h2: BudgetApprovalDecidedHandler, h3: ExecutionCompletedHandler) => [h1, h2, h3],
      inject: [OsCreatedHandler, BudgetApprovalDecidedHandler, ExecutionCompletedHandler],
    },
    SagaConsumerService,
  ],
})
export class SagaConsumerModule {}
