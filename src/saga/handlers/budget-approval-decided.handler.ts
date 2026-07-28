import { Injectable } from '@nestjs/common';
import { SagaEventHandler } from './saga-event-handler.interface';
import { SagaEvent, SagaEventType } from '../types/saga-event.types';
import { BudgetService } from '../../budget/budget.service';

@Injectable()
export class BudgetApprovalDecidedHandler implements SagaEventHandler {
  readonly eventType = SagaEventType.BUDGET_APPROVAL_DECIDED;

  constructor(private readonly budgetService: BudgetService) {}

  async handle(event: SagaEvent): Promise<void> {
    const { approved } = event.payload as { approved: boolean };
    await this.budgetService.handleApprovalDecided(event.workOrderId, approved);
  }
}
