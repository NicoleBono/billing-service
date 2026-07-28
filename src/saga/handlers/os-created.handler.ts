import { Injectable } from '@nestjs/common';
import { CreateBudgetUseCase } from '../../budgets/application/use-cases/create-budget.use-case';
import { OsCreatedPayload, SagaEventType } from '../types/saga-event.types';
import { SagaEventHandler } from './saga-event-handler.interface';

@Injectable()
export class OsCreatedHandler implements SagaEventHandler<OsCreatedPayload> {
  readonly eventType = SagaEventType.OS_CREATED;

  constructor(private readonly createBudget: CreateBudgetUseCase) {}

  async handle(workOrderId: number, payload: OsCreatedPayload): Promise<void> {
    await this.createBudget.execute({
      workOrderId,
      services: payload.services ?? [],
      parts: payload.parts ?? [],
      amount: payload.totalAmount,
    });
  }
}
