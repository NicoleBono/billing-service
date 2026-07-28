import { PaymentsController } from '../infra/controllers/payments.controller';

describe('PaymentsController', () => {
  const findPaymentByWorkOrderMock = { execute: jest.fn() };
  const handleWebhookMock = { execute: jest.fn() };
  const controller = new PaymentsController(findPaymentByWorkOrderMock as any, handleWebhookMock as any);

  afterEach(() => jest.clearAllMocks());

  it('should find a payment by work order id', async () => {
    findPaymentByWorkOrderMock.execute.mockResolvedValue({ id: '1', workOrderId: 10 });

    await expect(controller.findByWorkOrder('10')).resolves.toEqual({ id: '1', workOrderId: 10 });
    expect(findPaymentByWorkOrderMock.execute).toHaveBeenCalledWith(10);
  });

  it('should handle a Mercado Pago payment webhook (type field)', async () => {
    const result = await controller.mercadoPagoWebhook({ type: 'payment', data: { id: 'mp-1' } } as any);

    expect(handleWebhookMock.execute).toHaveBeenCalledWith('mp-1');
    expect(result).toEqual({ received: true });
  });

  it('should handle a Mercado Pago payment webhook (legacy topic/id fields)', async () => {
    await controller.mercadoPagoWebhook({ topic: 'payment', id: 'mp-2' } as any);

    expect(handleWebhookMock.execute).toHaveBeenCalledWith('mp-2');
  });

  it('should ignore non-payment webhook notifications', async () => {
    await controller.mercadoPagoWebhook({ type: 'merchant_order', data: { id: 'mo-1' } } as any);

    expect(handleWebhookMock.execute).not.toHaveBeenCalled();
  });
});
