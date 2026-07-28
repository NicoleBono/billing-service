import { FindBudgetByWorkOrderUseCase } from '../application/use-cases/find-budget-by-work-order.use-case';
import { NotFoundError } from '../../common/errors/domain.errors';

describe('FindBudgetByWorkOrderUseCase', () => {
  const repositoryMock = { findLatestByWorkOrderId: jest.fn() };
  const useCase = new FindBudgetByWorkOrderUseCase(repositoryMock as any);

  afterEach(() => jest.clearAllMocks());

  it('should return the latest budget for the work order', async () => {
    repositoryMock.findLatestByWorkOrderId.mockResolvedValue({ id: '1', workOrderId: 10 });

    await expect(useCase.execute(10)).resolves.toEqual({ id: '1', workOrderId: 10 });
  });

  it('should throw NotFoundError when there is no budget for the work order', async () => {
    repositoryMock.findLatestByWorkOrderId.mockResolvedValue(null);

    await expect(useCase.execute(10)).rejects.toThrow(NotFoundError);
  });
});
