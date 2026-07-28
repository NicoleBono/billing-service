import { Budget, BudgetStatus } from '../domain/entities/budget.entity';

describe('Budget entity', () => {
  it('should default status to PENDING', () => {
    const budget = new Budget({ workOrderId: 1, services: [], parts: [], amount: 100 });
    expect(budget.status).toBe(BudgetStatus.PENDING);
  });

  it('should reject a negative amount', () => {
    expect(() => new Budget({ workOrderId: 1, services: [], parts: [], amount: -1 })).toThrow(
      'Valor do orçamento não pode ser negativo',
    );
  });
});
