import { OsCreatedHandler } from '../handlers/os-created.handler';

describe('OsCreatedHandler', () => {
  const createBudgetMock = { execute: jest.fn() };
  const handler = new OsCreatedHandler(createBudgetMock as any);

  afterEach(() => jest.clearAllMocks());

  it('should create a budget from the OS_CREATED payload', async () => {
    await handler.handle(10, {
      customer: { name: 'Fulano', document: '123', email: 'f@f.com', phone: '119' },
      totalAmount: 300,
      services: [{ serviceId: 1, quantity: 1 }],
      parts: [{ partId: 2, quantity: 1 }],
    });

    expect(createBudgetMock.execute).toHaveBeenCalledWith({
      workOrderId: 10,
      services: [{ serviceId: 1, quantity: 1 }],
      parts: [{ partId: 2, quantity: 1 }],
      amount: 300,
    });
  });

  it('should default items to empty arrays when absent', async () => {
    await handler.handle(10, { totalAmount: 300 } as any);

    expect(createBudgetMock.execute).toHaveBeenCalledWith({
      workOrderId: 10,
      services: [],
      parts: [],
      amount: 300,
    });
  });
});
