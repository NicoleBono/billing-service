import { Inject, Injectable } from '@nestjs/common';
import { BudgetRepository } from '../../domain/repositories/budget.repository';
import { NotFoundError } from '../../../common/errors/domain.errors';

@Injectable()
export class VoidBudgetUseCase {
  constructor(
    @Inject(BudgetRepository)
    private readonly repository: BudgetRepository,
  ) {}

  async execute(workOrderId: number) {
    const budget = await this.repository.findLatestByWorkOrderId(workOrderId);
    if (!budget?.id) {
      throw new NotFoundError(`Nenhum orçamento encontrado para a OS ${workOrderId}`);
    }

    return this.repository.markVoid(budget.id);
  }
}
