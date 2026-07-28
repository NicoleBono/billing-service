import { BudgetApprovalDecidedHandler } from '../handlers/budget-approval-decided.handler';

describe('BudgetApprovalDecidedHandler', () => {
  const approveBudgetMock = { execute: jest.fn() };
  const voidBudgetMock = { execute: jest.fn() };
  const createPaymentMock = { execute: jest.fn() };
  const handler = new BudgetApprovalDecidedHandler(approveBudgetMock as any, voidBudgetMock as any, createPaymentMock as any);

  afterEach(() => jest.clearAllMocks());

  it('should approve the budget and create a payment when approved', async () => {
    approveBudgetMock.execute.mockResolvedValue({ id: 'b1', amount: 300 });

    await handler.handle(10, { approved: true });

    expect(approveBudgetMock.execute).toHaveBeenCalledWith(10);
    expect(createPaymentMock.execute).toHaveBeenCalledWith({ workOrderId: 10, budgetId: 'b1', amount: 300 });
    expect(voidBudgetMock.execute).not.toHaveBeenCalled();
  });

  it('should void the budget and skip payment creation when rejected', async () => {
    await handler.handle(10, { approved: false });

    expect(voidBudgetMock.execute).toHaveBeenCalledWith(10);
    expect(approveBudgetMock.execute).not.toHaveBeenCalled();
    expect(createPaymentMock.execute).not.toHaveBeenCalled();
  });
});
