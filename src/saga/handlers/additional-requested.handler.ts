import { Injectable } from '@nestjs/common';
import { CreateBudgetUseCase } from '../../budgets/application/use-cases/create-budget.use-case';
import { AdditionalRequestedPayload, SagaEventType } from '../types/saga-event.types';
import { SagaEventHandler } from './saga-event-handler.interface';

@Injectable()
export class AdditionalRequestedHandler implements SagaEventHandler<AdditionalRequestedPayload> {
  readonly eventType = SagaEventType.ADDITIONAL_REQUESTED;

  constructor(private readonly createBudget: CreateBudgetUseCase) {}

  async handle(workOrderId: number, payload: AdditionalRequestedPayload & { totalAmount?: number }): Promise<void> {
    await this.createBudget.execute({
      workOrderId,
      services: payload.services ?? [],
      parts: payload.parts ?? [],
      amount: payload.totalAmount ?? 0,
    });
  }
}
