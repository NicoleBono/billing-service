import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

function buildContext(req: any, res: any) {
  return { switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }) } as any;
}

describe('LoggingInterceptor', () => {
  const interceptor = new LoggingInterceptor();
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should log a structured success entry and reuse the incoming correlation id', (done) => {
    const req: any = { headers: { 'x-correlation-id': 'abc-123' }, method: 'GET', url: '/billing/budgets/1' };
    const res = { statusCode: 200 };
    const context = buildContext(req, res);
    const next = { handle: () => of({ ok: true }) };

    interceptor.intercept(context, next).subscribe(() => {
      expect(req.correlationId).toBe('abc-123');
      expect(logSpy).toHaveBeenCalledTimes(1);
      const logged = JSON.parse(logSpy.mock.calls[0][0]);
      expect(logged).toMatchObject({ level: 'info', correlationId: 'abc-123', method: 'GET', statusCode: 200 });
      done();
    });
  });

  it('should generate a correlation id and log a structured error entry when the handler throws', (done) => {
    const req: any = { headers: {}, method: 'POST', url: '/billing/webhooks/mercadopago' };
    const res = {};
    const context = buildContext(req, res);
    const next = { handle: () => throwError(() => Object.assign(new Error('falhou'), { status: 400 })) };

    interceptor.intercept(context, next).subscribe({
      error: () => {
        expect(req.correlationId).toEqual(expect.any(String));
        expect(errorSpy).toHaveBeenCalledTimes(1);
        const logged = JSON.parse(errorSpy.mock.calls[0][0]);
        expect(logged).toMatchObject({ level: 'error', method: 'POST', error: 'falhou', statusCode: 400 });
        done();
      },
    });
  });
});
