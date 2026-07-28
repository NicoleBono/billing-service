import { Injectable } from '@nestjs/common';
import { ApproveBudgetUseCase } from '../../budgets/application/use-cases/approve-budget.use-case';
import { VoidBudgetUseCase } from '../../budgets/application/use-cases/void-budget.use-case';
import { CreatePaymentUseCase } from '../../payments/application/use-cases/create-payment.use-case';
import { BudgetApprovalDecidedPayload, SagaEventType } from '../types/saga-event.types';
import { SagaEventHandler } from './saga-event-handler.interface';

@Injectable()
export class BudgetApprovalDecidedHandler implements SagaEventHandler<BudgetApprovalDecidedPayload> {
  readonly eventType = SagaEventType.BUDGET_APPROVAL_DECIDED;

  constructor(
    private readonly approveBudget: ApproveBudgetUseCase,
    private readonly voidBudget: VoidBudgetUseCase,
    private readonly createPayment: CreatePaymentUseCase,
  ) {}

  async handle(workOrderId: number, payload: BudgetApprovalDecidedPayload): Promise<void> {
    if (!payload.approved) {
      // Compensação: orçamento rejeitado pelo cliente, encerra este ciclo.
      await this.voidBudget.execute(workOrderId);
      return;
    }

    const budget = await this.approveBudget.execute(workOrderId);
    await this.createPayment.execute({
      workOrderId,
      budgetId: budget.id as string,
      amount: budget.amount,
    });
  }
}
