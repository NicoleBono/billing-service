import { Injectable } from '@nestjs/common';
import { SagaEventHandler } from './saga-event-handler.interface';
import { SagaEvent, SagaEventType } from '../types/saga-event.types';
import { BudgetService } from '../../budget/budget.service';

@Injectable()
export class OsCreatedHandler implements SagaEventHandler {
  readonly eventType = SagaEventType.OS_CREATED;

  constructor(private readonly budgetService: BudgetService) {}

  async handle(event: SagaEvent): Promise<void> {
    await this.budgetService.createFromWorkOrder(event.workOrderId);
  }
}
