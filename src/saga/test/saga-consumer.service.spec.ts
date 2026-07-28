import { SQSClient } from '@aws-sdk/client-sqs';
import { SagaConsumerService } from '../consumer/saga-consumer.service';
import { SagaEventType } from '../types/saga-event.types';

jest.mock('@aws-sdk/client-sqs', () => {
  const actual = jest.requireActual('@aws-sdk/client-sqs');
  return {
    ...actual,
    SQSClient: jest.fn().mockImplementation(() => ({ send: jest.fn().mockResolvedValue({}) })),
  };
});

describe('SagaConsumerService (message dispatch)', () => {
  const originalEnv = process.env;
  let consumer: SagaConsumerService;
  let client: { send: jest.Mock };
  const osCreatedHandler = { eventType: SagaEventType.OS_CREATED, handle: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, SAGA_SQS_QUEUE_URL: 'https://sqs.local/queue' };
    consumer = new SagaConsumerService([osCreatedHandler as any]);
    client = (SQSClient as unknown as jest.Mock).mock.results[0].value;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should dispatch a raw SQS message to the matching handler and delete it', async () => {
    const message = {
      ReceiptHandle: 'r1',
      Body: JSON.stringify({ eventType: SagaEventType.OS_CREATED, workOrderId: 7, payload: { totalAmount: 100 } }),
    };

    await (consumer as any).processMessage(message);

    expect(osCreatedHandler.handle).toHaveBeenCalledWith(7, { totalAmount: 100 });
    expect(client.send).toHaveBeenCalledTimes(1);
  });

  it('should unwrap SNS-envelope messages before dispatching', async () => {
    const inner = JSON.stringify({ eventType: SagaEventType.OS_CREATED, workOrderId: 8, payload: {} });
    const message = { ReceiptHandle: 'r2', Body: JSON.stringify({ Message: inner }) };

    await (consumer as any).processMessage(message);

    expect(osCreatedHandler.handle).toHaveBeenCalledWith(8, {});
  });

  it('should delete the message and skip handling when no handler matches the event type', async () => {
    const message = {
      ReceiptHandle: 'r3',
      Body: JSON.stringify({ eventType: 'UNKNOWN_EVENT', workOrderId: 9, payload: {} }),
    };

    await (consumer as any).processMessage(message);

    expect(osCreatedHandler.handle).not.toHaveBeenCalled();
    expect(client.send).toHaveBeenCalledTimes(1);
  });

  it('should not delete the message when the handler throws (left for retry/DLQ)', async () => {
    osCreatedHandler.handle.mockRejectedValueOnce(new Error('boom'));
    const message = {
      ReceiptHandle: 'r4',
      Body: JSON.stringify({ eventType: SagaEventType.OS_CREATED, workOrderId: 10, payload: {} }),
    };

    await (consumer as any).processMessage(message);

    expect(client.send).not.toHaveBeenCalled();
  });

  describe('onModuleInit / onModuleDestroy', () => {
    it('should warn and not start polling when SAGA_SQS_QUEUE_URL is not configured', () => {
      process.env.SAGA_SQS_QUEUE_URL = '';
      const idleConsumer = new SagaConsumerService([osCreatedHandler as any]);
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      idleConsumer.onModuleInit();

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should poll the queue at least once and stop cleanly on module destroy', async () => {
      const idleClient = { send: jest.fn().mockResolvedValue({}) };
      (SQSClient as unknown as jest.Mock).mockImplementationOnce(() => idleClient);
      const polledConsumer = new SagaConsumerService([osCreatedHandler as any]);

      polledConsumer.onModuleInit();
      polledConsumer.onModuleDestroy();
      // dá espaço para a primeira iteração do while (já em andamento) finalizar
      await new Promise((resolve) => setImmediate(resolve));

      expect(idleClient.send).toHaveBeenCalled();
    });

    it('should log and keep polling when receiving from SQS fails', async () => {
      const failingClient = { send: jest.fn().mockRejectedValue(new Error('sqs down')) };
      (SQSClient as unknown as jest.Mock).mockImplementationOnce(() => failingClient);
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const failingConsumer = new SagaConsumerService([osCreatedHandler as any]);

      failingConsumer.onModuleInit();
      failingConsumer.onModuleDestroy();
      await new Promise((resolve) => setImmediate(resolve));

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});
