import { AdditionalRequestedHandler } from '../handlers/additional-requested.handler';

describe('AdditionalRequestedHandler', () => {
  const createBudgetMock = { execute: jest.fn() };
  const handler = new AdditionalRequestedHandler(createBudgetMock as any);

  afterEach(() => jest.clearAllMocks());

  it('should create a supplementary budget with the new cumulative total', async () => {
    await handler.handle(10, {
      services: [{ serviceId: 3, quantity: 1 }],
      parts: [],
      totalAmount: 550,
    });

    expect(createBudgetMock.execute).toHaveBeenCalledWith({
      workOrderId: 10,
      services: [{ serviceId: 3, quantity: 1 }],
      parts: [],
      amount: 550,
    });
  });

  it('should default items and amount when the payload omits them', async () => {
    await handler.handle(10, {} as any);

    expect(createBudgetMock.execute).toHaveBeenCalledWith({
      workOrderId: 10,
      services: [],
      parts: [],
      amount: 0,
    });
  });
});
