import { BudgetsController } from '../infra/controllers/budgets.controller';

describe('BudgetsController', () => {
  const findBudgetByWorkOrderMock = { execute: jest.fn() };
  const controller = new BudgetsController(findBudgetByWorkOrderMock as any);

  afterEach(() => jest.clearAllMocks());

  it('should find a budget by work order id', async () => {
    findBudgetByWorkOrderMock.execute.mockResolvedValue({ id: '1', workOrderId: 10 });

    await expect(controller.findByWorkOrder('10')).resolves.toEqual({ id: '1', workOrderId: 10 });
    expect(findBudgetByWorkOrderMock.execute).toHaveBeenCalledWith(10);
  });
});
