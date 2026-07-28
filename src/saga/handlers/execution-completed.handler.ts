import { Injectable } from '@nestjs/common';
import { SagaEventHandler } from './saga-event-handler.interface';
import { SagaEvent, SagaEventType } from '../types/saga-event.types';
import { BudgetService } from '../../budget/budget.service';

@Injectable()
export class ExecutionCompletedHandler implements SagaEventHandler {
  readonly eventType = SagaEventType.EXECUTION_COMPLETED;

  constructor(private readonly budgetService: BudgetService) {}

  async handle(event: SagaEvent): Promise<void> {
    await this.budgetService.handleExecutionCompleted(event.workOrderId);
  }
}
