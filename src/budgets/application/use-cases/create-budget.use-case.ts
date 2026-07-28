import { Inject, Injectable } from '@nestjs/common';
import { BudgetRepository } from '../../domain/repositories/budget.repository';
import { BudgetItem } from '../../domain/entities/budget.entity';
import { SagaPublisherService } from '../../../saga/publisher/saga-publisher.service';
import { SagaEventType } from '../../../saga/types/saga-event.types';

export type CreateBudgetCommand = {
  workOrderId: number;
  services: BudgetItem[];
  parts: BudgetItem[];
  amount: number;
};

@Injectable()
export class CreateBudgetUseCase {
  constructor(
    @Inject(BudgetRepository)
    private readonly repository: BudgetRepository,
    private readonly sagaPublisher: SagaPublisherService,
  ) {}

  async execute(command: CreateBudgetCommand) {
    const budget = await this.repository.create({
      workOrderId: command.workOrderId,
      services: command.services,
      parts: command.parts,
      amount: command.amount,
    });

    await this.sagaPublisher.publish(SagaEventType.BUDGET_GENERATED, command.workOrderId, {
      budgetId: budget.id,
      amount: budget.amount,
    });

    return budget;
  }
}
