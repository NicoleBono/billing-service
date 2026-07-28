import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SagaPublisherService } from '../publisher/saga-publisher.service';
import { SagaEventType } from '../types/saga-event.types';

jest.mock('@aws-sdk/client-sns', () => {
  const actual = jest.requireActual('@aws-sdk/client-sns');
  return {
    ...actual,
    SNSClient: jest.fn().mockImplementation(() => ({ send: jest.fn().mockResolvedValue({}) })),
  };
});

describe('SagaPublisherService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, SAGA_SNS_TOPIC_ARN: 'arn:aws:sns:us-east-1:000000000000:oficina-saga-events' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should publish an event to the SNS topic with the eventType message attribute', async () => {
    const publisher = new SagaPublisherService();
    const client = (SNSClient as unknown as jest.Mock).mock.results[0].value;

    await publisher.publish(SagaEventType.BUDGET_GENERATED, 10, { budgetId: 'b1' });

    expect(client.send).toHaveBeenCalledTimes(1);
    const command = client.send.mock.calls[0][0] as PublishCommand;
    expect(command.input.MessageAttributes?.eventType.StringValue).toBe(SagaEventType.BUDGET_GENERATED);

    const message = JSON.parse(command.input.Message as string);
    expect(message.workOrderId).toBe(10);
    expect(message.payload).toEqual({ budgetId: 'b1' });
  });

  it('should skip publishing when SAGA_SNS_TOPIC_ARN is not configured', async () => {
    process.env.SAGA_SNS_TOPIC_ARN = '';
    const publisher = new SagaPublisherService();
    const client = (SNSClient as unknown as jest.Mock).mock.results[0].value;

    await publisher.publish(SagaEventType.BUDGET_GENERATED, 10, {});

    expect(client.send).not.toHaveBeenCalled();
  });
});
