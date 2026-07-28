import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DeleteMessageCommand, Message, ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { SAGA_EVENT_HANDLER, SagaEventHandler } from '../handlers/saga-event-handler.interface';
import { SagaEvent } from '../types/saga-event.types';

@Injectable()
export class SagaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly client: SQSClient;
  private readonly queueUrl: string;
  private readonly handlersByEventType = new Map<string, SagaEventHandler>();
  private polling = false;
  private stopped = false;

  constructor(@Inject(SAGA_EVENT_HANDLER) handlers: SagaEventHandler[]) {
    this.client = new SQSClient({
      region: process.env.AWS_REGION || 'us-east-1',
      ...(process.env.AWS_ENDPOINT_URL && { endpoint: process.env.AWS_ENDPOINT_URL }),
    });
    this.queueUrl = process.env.SAGA_SQS_QUEUE_URL || '';

    for (const handler of handlers) {
      this.handlersByEventType.set(handler.eventType, handler);
    }
  }

  onModuleInit() {
    if (!this.queueUrl) {
      console.warn(
        JSON.stringify({ level: 'warn', message: 'SAGA_SQS_QUEUE_URL não configurado; consumer da saga não iniciado' }),
      );
      return;
    }

    this.polling = true;
    void this.poll();
  }

  onModuleDestroy() {
    this.stopped = true;
  }

  private async poll() {
    while (this.polling && !this.stopped) {
      try {
        const result = await this.client.send(
          new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
            MessageAttributeNames: ['All'],
          }),
        );

        for (const message of result.Messages ?? []) {
          await this.processMessage(message);
        }
      } catch (error: any) {
        console.error(JSON.stringify({ level: 'error', message: 'saga_consumer_poll_error', error: error.message }));
      }
    }
  }

  private async processMessage(message: Message) {
    try {
      const body = JSON.parse(message.Body ?? '{}');
      const event: SagaEvent = body.Message ? JSON.parse(body.Message) : body;

      const handler = this.handlersByEventType.get(event.eventType);
      if (!handler) {
        console.warn(JSON.stringify({ level: 'warn', message: 'saga_event_no_handler', eventType: event.eventType }));
        await this.deleteMessage(message);
        return;
      }

      await handler.handle(event.workOrderId, event.payload);
      await this.deleteMessage(message);

      console.log(JSON.stringify({ level: 'info', message: 'saga_event_processed', eventType: event.eventType, workOrderId: event.workOrderId }));
    } catch (error: any) {
      console.error(JSON.stringify({ level: 'error', message: 'saga_event_processing_failed', error: error.message }));
    }
  }

  private deleteMessage(message: Message) {
    return this.client.send(
      new DeleteMessageCommand({ QueueUrl: this.queueUrl, ReceiptHandle: message.ReceiptHandle }),
    );
  }
}
