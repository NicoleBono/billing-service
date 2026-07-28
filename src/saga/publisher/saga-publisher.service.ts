import { Injectable } from '@nestjs/common';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { SagaEventType } from '../types/saga-event.types';

@Injectable()
export class SagaPublisherService {
  private readonly client: SNSClient;
  private readonly topicArn: string;

  constructor() {
    this.client = new SNSClient({
      region: process.env.AWS_REGION || 'us-east-1',
      ...(process.env.AWS_ENDPOINT_URL && { endpoint: process.env.AWS_ENDPOINT_URL }),
    });
    this.topicArn = process.env.SAGA_SNS_TOPIC_ARN || '';
  }

  async publish(eventType: SagaEventType, workOrderId: number, payload: Record<string, unknown> = {}) {
    if (!this.topicArn) {
      console.warn(
        JSON.stringify({ level: 'warn', message: 'SAGA_SNS_TOPIC_ARN não configurado; evento não publicado', eventType, workOrderId }),
      );
      return;
    }

    const message = {
      eventType,
      workOrderId,
      payload,
      occurredAt: new Date().toISOString(),
    };

    await this.client.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Message: JSON.stringify(message),
        MessageAttributes: {
          eventType: { DataType: 'String', StringValue: eventType },
        },
      }),
    );

    console.log(JSON.stringify({ level: 'info', message: 'saga_event_published', eventType, workOrderId }));
  }
}
