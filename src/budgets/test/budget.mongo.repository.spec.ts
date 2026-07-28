import { NotFoundException } from '@nestjs/common';
import { BudgetMongoRepository } from '../infra/mongo/budget.mongo.repository';
import { BudgetStatus } from '../domain/entities/budget.entity';

function fakeDoc(overrides: Record<string, any> = {}) {
  return {
    _id: { toString: () => overrides.id ?? '1' },
    workOrderId: 10,
    services: [],
    parts: [],
    amount: 200,
    status: BudgetStatus.PENDING,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('BudgetMongoRepository', () => {
  let model: any;
  let repository: BudgetMongoRepository;

  beforeEach(() => {
    model = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };
    repository = new BudgetMongoRepository(model);
  });

  it('should create a budget and map it to the domain entity', async () => {
    model.create.mockResolvedValue(fakeDoc());

    const result = await repository.create({ workOrderId: 10, services: [], parts: [], amount: 200 });

    expect(model.create).toHaveBeenCalledWith({
      workOrderId: 10,
      services: [],
      parts: [],
      amount: 200,
      status: BudgetStatus.PENDING,
    });
    expect(result.id).toBe('1');
    expect(result.amount).toBe(200);
  });

  it('should find the latest budget by work order id', async () => {
    const exec = jest.fn().mockResolvedValue(fakeDoc());
    const sort = jest.fn().mockReturnValue({ exec });
    model.findOne.mockReturnValue({ sort });

    const result = await repository.findLatestByWorkOrderId(10);

    expect(model.findOne).toHaveBeenCalledWith({ workOrderId: 10 });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result?.id).toBe('1');
  });

  it('should return null when no budget is found', async () => {
    const exec = jest.fn().mockResolvedValue(null);
    model.findOne.mockReturnValue({ sort: jest.fn().mockReturnValue({ exec }) });

    await expect(repository.findLatestByWorkOrderId(999)).resolves.toBeNull();
  });

  it('should mark a budget as approved', async () => {
    const exec = jest.fn().mockResolvedValue(fakeDoc({ status: BudgetStatus.APPROVED }));
    model.findByIdAndUpdate.mockReturnValue({ exec });

    const result = await repository.markApproved('1');

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith('1', { status: BudgetStatus.APPROVED }, { new: true });
    expect(result.status).toBe(BudgetStatus.APPROVED);
  });

  it('should throw when approving a budget that does not exist', async () => {
    model.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

    await expect(repository.markApproved('missing')).rejects.toThrow(NotFoundException);
  });

  it('should mark a budget as void', async () => {
    const exec = jest.fn().mockResolvedValue(fakeDoc({ status: BudgetStatus.VOID }));
    model.findByIdAndUpdate.mockReturnValue({ exec });

    const result = await repository.markVoid('1');

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith('1', { status: BudgetStatus.VOID }, { new: true });
    expect(result.status).toBe(BudgetStatus.VOID);
  });

  it('should throw when voiding a budget that does not exist', async () => {
    model.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

    await expect(repository.markVoid('missing')).rejects.toThrow(NotFoundException);
  });
});
