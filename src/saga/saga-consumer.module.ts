import { Module } from '@nestjs/common';
import { SagaConsumerService } from './consumer/saga-consumer.service';
import { SAGA_EVENT_HANDLER } from './handlers/saga-event-handler.interface';
import { OsCreatedHandler } from './handlers/os-created.handler';
import { BudgetApprovalDecidedHandler } from './handlers/budget-approval-decided.handler';
import { ExecutionCompletedHandler } from './handlers/execution-completed.handler';
import { SagaPublisherModule } from './saga-publisher.module';
import { BudgetModule } from '../budget/budget.module';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handlers: any[] = [
  { provide: SAGA_EVENT_HANDLER, useClass: OsCreatedHandler, multi: true },
  { provide: SAGA_EVENT_HANDLER, useClass: BudgetApprovalDecidedHandler, multi: true },
  { provide: SAGA_EVENT_HANDLER, useClass: ExecutionCompletedHandler, multi: true },
];

@Module({
  imports: [SagaPublisherModule, BudgetModule],
  providers: [SagaConsumerService, ...handlers],
})
export class SagaConsumerModule {}
