import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('should report ok when the database ping succeeds', async () => {
    const connectionMock = { db: { admin: () => ({ ping: jest.fn().mockResolvedValue({}) }) } };
    const controller = new HealthController(connectionMock as any);

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.services.database.status).toBe('ok');
  });

  it('should not throw when the connection has no database bound yet', async () => {
    const connectionMock = { db: undefined };
    const controller = new HealthController(connectionMock as any);

    const result = await controller.check();

    expect(result.status).toBe('ok');
  });

  it('should report degraded when the database ping fails', async () => {
    const connectionMock = {
      db: { admin: () => ({ ping: jest.fn().mockRejectedValue(new Error('down')) }) },
    };
    const controller = new HealthController(connectionMock as any);

    const result = await controller.check();

    expect(result.status).toBe('degraded');
    expect(result.services.database.status).toBe('unavailable');
  });
});
