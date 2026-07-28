import { Payment, PaymentStatus } from '../domain/entities/payment.entity';

describe('Payment entity', () => {
  it('should default status to PENDING when not provided', () => {
    const payment = new Payment({ workOrderId: 1, budgetId: 'b1', amount: 100 });
    expect(payment.status).toBe(PaymentStatus.PENDING);
  });

  it('should keep an explicitly provided status', () => {
    const payment = new Payment({ workOrderId: 1, budgetId: 'b1', amount: 100, status: PaymentStatus.CONFIRMED });
    expect(payment.status).toBe(PaymentStatus.CONFIRMED);
  });
});
