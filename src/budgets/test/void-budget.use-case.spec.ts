import { VoidBudgetUseCase } from '../application/use-cases/void-budget.use-case';
import { NotFoundError } from '../../common/errors/domain.errors';

describe('VoidBudgetUseCase', () => {
  const repositoryMock = { findLatestByWorkOrderId: jest.fn(), markVoid: jest.fn() };
  const useCase = new VoidBudgetUseCase(repositoryMock as any);

  afterEach(() => jest.clearAllMocks());

  it('should void the latest budget for the work order', async () => {
    repositoryMock.findLatestByWorkOrderId.mockResolvedValue({ id: '1' });
    repositoryMock.markVoid.mockResolvedValue({ id: '1', status: 'VOID' });

    const result = await useCase.execute(10);

    expect(repositoryMock.markVoid).toHaveBeenCalledWith('1');
    expect(result.status).toBe('VOID');
  });

  it('should throw NotFoundError when there is no budget for the work order', async () => {
    repositoryMock.findLatestByWorkOrderId.mockResolvedValue(null);

    await expect(useCase.execute(10)).rejects.toThrow(NotFoundError);
  });
});
