import { NotFoundException } from '@nestjs/common';
import { PaymentMongoRepository } from '../infra/mongo/payment.mongo.repository';
import { PaymentStatus } from '../domain/entities/payment.entity';

function fakeDoc(overrides: Record<string, any> = {}) {
  return {
    _id: { toString: () => overrides.id ?? '1' },
    workOrderId: 10,
    budgetId: 'b1',
    amount: 200,
    status: PaymentStatus.PENDING,
    mpPreferenceId: 'pref-1',
    mpPaymentId: undefined,
    paymentLink: 'https://mp/pay/1',
    failureReason: undefined,
    createdAt: new Date('2026-01-01'),
    confirmedAt: undefined,
    ...overrides,
  };
}

describe('PaymentMongoRepository', () => {
  let model: any;
  let repository: PaymentMongoRepository;

  beforeEach(() => {
    model = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };
    repository = new PaymentMongoRepository(model);
  });

  it('should create a pending payment', async () => {
    model.create.mockResolvedValue(fakeDoc());

    const result = await repository.create({
      workOrderId: 10,
      budgetId: 'b1',
      amount: 200,
      mpPreferenceId: 'pref-1',
      paymentLink: 'https://mp/pay/1',
    });

    expect(model.create).toHaveBeenCalledWith({
      workOrderId: 10,
      budgetId: 'b1',
      amount: 200,
      mpPreferenceId: 'pref-1',
      paymentLink: 'https://mp/pay/1',
      status: PaymentStatus.PENDING,
    });
    expect(result.id).toBe('1');
  });

  it('should find the latest payment by work order id', async () => {
    const exec = jest.fn().mockResolvedValue(fakeDoc());
    model.findOne.mockReturnValue({ sort: jest.fn().mockReturnValue({ exec }) });

    const result = await repository.findLatestByWorkOrderId(10);

    expect(model.findOne).toHaveBeenCalledWith({ workOrderId: 10 });
    expect(result?.id).toBe('1');
  });

  it('should return null when no payment matches the work order id', async () => {
    const exec = jest.fn().mockResolvedValue(null);
    model.findOne.mockReturnValue({ sort: jest.fn().mockReturnValue({ exec }) });

    await expect(repository.findLatestByWorkOrderId(999)).resolves.toBeNull();
  });

  it('should find a payment by mp payment id', async () => {
    model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(fakeDoc({ mpPaymentId: 'mp-1' })) });

    const result = await repository.findByMpPaymentId('mp-1');

    expect(model.findOne).toHaveBeenCalledWith({ mpPaymentId: 'mp-1' });
    expect(result?.mpPaymentId).toBe('mp-1');
  });

  it('should return null when no payment matches the mp payment id', async () => {
    model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

    await expect(repository.findByMpPaymentId('missing')).resolves.toBeNull();
  });

  it('should link the mp payment id', async () => {
    model.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(fakeDoc({ mpPaymentId: 'mp-1' })) });

    const result = await repository.linkMpPaymentId('1', 'mp-1');

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith('1', { mpPaymentId: 'mp-1' }, { new: true });
    expect(result.mpPaymentId).toBe('mp-1');
  });

  it('should throw when linking a payment that does not exist', async () => {
    model.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

    await expect(repository.linkMpPaymentId('missing', 'mp-1')).rejects.toThrow(NotFoundException);
  });

  it('should mark a payment as confirmed', async () => {
    model.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(fakeDoc({ status: PaymentStatus.CONFIRMED, confirmedAt: new Date() })),
    });

    const result = await repository.markConfirmed('1');

    expect(result.status).toBe(PaymentStatus.CONFIRMED);
  });

  it('should throw when confirming a payment that does not exist', async () => {
    model.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

    await expect(repository.markConfirmed('missing')).rejects.toThrow(NotFoundException);
  });

  it('should mark a payment as failed with a reason', async () => {
    model.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(fakeDoc({ status: PaymentStatus.FAILED, failureReason: 'cartão recusado' })),
    });

    const result = await repository.markFailed('1', 'cartão recusado');

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      { status: PaymentStatus.FAILED, failureReason: 'cartão recusado' },
      { new: true },
    );
    expect(result.failureReason).toBe('cartão recusado');
  });

  it('should throw when failing a payment that does not exist', async () => {
    model.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

    await expect(repository.markFailed('missing', 'reason')).rejects.toThrow(NotFoundException);
  });
});
