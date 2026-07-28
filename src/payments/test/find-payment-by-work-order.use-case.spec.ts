import { FindPaymentByWorkOrderUseCase } from '../application/use-cases/find-payment-by-work-order.use-case';
import { NotFoundError } from '../../common/errors/domain.errors';

describe('FindPaymentByWorkOrderUseCase', () => {
  const repositoryMock = { findLatestByWorkOrderId: jest.fn() };
  const useCase = new FindPaymentByWorkOrderUseCase(repositoryMock as any);

  afterEach(() => jest.clearAllMocks());

  it('should return the latest payment for the work order', async () => {
    repositoryMock.findLatestByWorkOrderId.mockResolvedValue({ id: '1', workOrderId: 10 });

    await expect(useCase.execute(10)).resolves.toEqual({ id: '1', workOrderId: 10 });
  });

  it('should throw NotFoundError when there is no payment for the work order', async () => {
    repositoryMock.findLatestByWorkOrderId.mockResolvedValue(null);

    await expect(useCase.execute(10)).rejects.toThrow(NotFoundError);
  });
});
