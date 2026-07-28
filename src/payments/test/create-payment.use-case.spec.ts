import { CreatePaymentUseCase } from '../application/use-cases/create-payment.use-case';

describe('CreatePaymentUseCase', () => {
  const repositoryMock = { create: jest.fn() };
  const mercadoPagoMock = { createPreference: jest.fn() };
  const useCase = new CreatePaymentUseCase(repositoryMock as any, mercadoPagoMock as any);

  afterEach(() => jest.clearAllMocks());

  it('should create a Mercado Pago preference and persist a pending payment', async () => {
    mercadoPagoMock.createPreference.mockResolvedValue({ preferenceId: 'pref-1', paymentLink: 'https://mp/pay/1' });
    repositoryMock.create.mockResolvedValue({ id: '1', status: 'PENDING' });

    const result = await useCase.execute({ workOrderId: 10, budgetId: 'b1', amount: 200 });

    expect(mercadoPagoMock.createPreference).toHaveBeenCalledWith(10, 200);
    expect(repositoryMock.create).toHaveBeenCalledWith({
      workOrderId: 10,
      budgetId: 'b1',
      amount: 200,
      mpPreferenceId: 'pref-1',
      paymentLink: 'https://mp/pay/1',
    });
    expect(result.status).toBe('PENDING');
  });
});
