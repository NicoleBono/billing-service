import { HandleMercadoPagoWebhookUseCase } from '../application/use-cases/handle-mercadopago-webhook.use-case';
import { NotFoundError } from '../../common/errors/domain.errors';

describe('HandleMercadoPagoWebhookUseCase', () => {
  const repositoryMock = {
    findLatestByWorkOrderId: jest.fn(),
    linkMpPaymentId: jest.fn(),
    markConfirmed: jest.fn(),
    markFailed: jest.fn(),
  };
  const mercadoPagoMock = { getPaymentDetails: jest.fn() };
  const sagaPublisherMock = { publish: jest.fn() };
  const useCase = new HandleMercadoPagoWebhookUseCase(repositoryMock as any, mercadoPagoMock as any, sagaPublisherMock as any);

  afterEach(() => jest.clearAllMocks());

  it('should confirm the payment and publish PAYMENT_CONFIRMED when approved', async () => {
    mercadoPagoMock.getPaymentDetails.mockResolvedValue({ status: 'approved', workOrderId: 10 });
    repositoryMock.findLatestByWorkOrderId.mockResolvedValue({ id: '1' });

    await useCase.execute('mp-1');

    expect(repositoryMock.linkMpPaymentId).toHaveBeenCalledWith('1', 'mp-1');
    expect(repositoryMock.markConfirmed).toHaveBeenCalledWith('1');
    expect(sagaPublisherMock.publish).toHaveBeenCalledWith('PAYMENT_CONFIRMED', 10, {});
    expect(repositoryMock.markFailed).not.toHaveBeenCalled();
  });

  it('should fail the payment and publish PAYMENT_FAILED when rejected', async () => {
    mercadoPagoMock.getPaymentDetails.mockResolvedValue({ status: 'rejected', statusDetail: 'cc_rejected', workOrderId: 10 });
    repositoryMock.findLatestByWorkOrderId.mockResolvedValue({ id: '1' });

    await useCase.execute('mp-1');

    expect(repositoryMock.markFailed).toHaveBeenCalledWith('1', 'cc_rejected');
    expect(sagaPublisherMock.publish).toHaveBeenCalledWith('PAYMENT_FAILED', 10, { reason: 'cc_rejected' });
    expect(repositoryMock.markConfirmed).not.toHaveBeenCalled();
  });

  it('should fall back to a generic reason when Mercado Pago provides no statusDetail', async () => {
    mercadoPagoMock.getPaymentDetails.mockResolvedValue({ status: 'cancelled', workOrderId: 10 });
    repositoryMock.findLatestByWorkOrderId.mockResolvedValue({ id: '1' });

    await useCase.execute('mp-1');

    expect(repositoryMock.markFailed).toHaveBeenCalledWith('1', 'pagamento cancelled');
    expect(sagaPublisherMock.publish).toHaveBeenCalledWith('PAYMENT_FAILED', 10, { reason: 'pagamento cancelled' });
  });

  it('should do nothing while the payment is still pending', async () => {
    mercadoPagoMock.getPaymentDetails.mockResolvedValue({ status: 'pending', workOrderId: 10 });
    repositoryMock.findLatestByWorkOrderId.mockResolvedValue({ id: '1' });

    await useCase.execute('mp-1');

    expect(repositoryMock.markConfirmed).not.toHaveBeenCalled();
    expect(repositoryMock.markFailed).not.toHaveBeenCalled();
    expect(sagaPublisherMock.publish).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when there is no payment for the work order', async () => {
    mercadoPagoMock.getPaymentDetails.mockResolvedValue({ status: 'approved', workOrderId: 999 });
    repositoryMock.findLatestByWorkOrderId.mockResolvedValue(null);

    await expect(useCase.execute('mp-1')).rejects.toThrow(NotFoundError);
  });
});
