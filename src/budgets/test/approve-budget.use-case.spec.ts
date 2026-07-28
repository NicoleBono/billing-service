import { ApproveBudgetUseCase } from '../application/use-cases/approve-budget.use-case';
import { NotFoundError } from '../../common/errors/domain.errors';

describe('ApproveBudgetUseCase', () => {
  const repositoryMock = { findLatestByWorkOrderId: jest.fn(), markApproved: jest.fn() };
  const useCase = new ApproveBudgetUseCase(repositoryMock as any);

  afterEach(() => jest.clearAllMocks());

  it('should approve the latest budget for the work order', async () => {
    repositoryMock.findLatestByWorkOrderId.mockResolvedValue({ id: '1' });
    repositoryMock.markApproved.mockResolvedValue({ id: '1', status: 'APPROVED' });

    const result = await useCase.execute(10);

    expect(repositoryMock.markApproved).toHaveBeenCalledWith('1');
    expect(result.status).toBe('APPROVED');
  });

  it('should throw NotFoundError when there is no budget for the work order', async () => {
    repositoryMock.findLatestByWorkOrderId.mockResolvedValue(null);

    await expect(useCase.execute(10)).rejects.toThrow(NotFoundError);
  });
});
