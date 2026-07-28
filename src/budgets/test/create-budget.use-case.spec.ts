import { CreateBudgetUseCase } from '../application/use-cases/create-budget.use-case';
import { BudgetStatus } from '../domain/entities/budget.entity';

describe('CreateBudgetUseCase', () => {
  const repositoryMock = { create: jest.fn() };
  const sagaPublisherMock = { publish: jest.fn() };
  const useCase = new CreateBudgetUseCase(repositoryMock as any, sagaPublisherMock as any);

  afterEach(() => jest.clearAllMocks());

  it('should create a budget and publish BUDGET_GENERATED', async () => {
    repositoryMock.create.mockResolvedValue({
      id: '1',
      workOrderId: 10,
      services: [],
      parts: [],
      amount: 200,
      status: BudgetStatus.PENDING,
    });

    const result = await useCase.execute({ workOrderId: 10, services: [], parts: [], amount: 200 });

    expect(repositoryMock.create).toHaveBeenCalledWith({ workOrderId: 10, services: [], parts: [], amount: 200 });
    expect(sagaPublisherMock.publish).toHaveBeenCalledWith('BUDGET_GENERATED', 10, { budgetId: '1', amount: 200 });
    expect(result.id).toBe('1');
  });
});
