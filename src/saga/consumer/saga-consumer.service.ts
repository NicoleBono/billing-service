import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { SAGA_EVENT_HANDLER, SagaEventHandler } from '../handlers/saga-event-handler.interface';
import { SagaEvent } from '../types/saga-event.types';

@Injectable()
export class SagaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly client: SQSClient;
  private readonly queueUrl: string;
  private readonly handlersByEventType = new Map<string, SagaEventHandler>();
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
      console.warn(JSON.stringify({ level: 'warn', message: 'SAGA_SQS_QUEUE_URL não configurado; consumer não iniciado' }));
      return;
    }
    void this.poll();
  }

  onModuleDestroy() { this.stopped = true; }

  private async poll() {
    while (!this.stopped) {
      try {
        const response = await this.client.send(new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20,
        }));

        for (const message of response.Messages ?? []) {
          await this.processMessage(message);
        }
      } catch (err) {
        if (!this.stopped) {
          console.error(JSON.stringify({ level: 'error', message: 'saga_poll_error', error: String(err) }));
          await new Promise(r => setTimeout(r, 5000));
        }
      }
    }
  }

  private async processMessage(message: { Body?: string; ReceiptHandle?: string }) {
    try {
      const body = JSON.parse(message.Body ?? '{}');
      const event: SagaEvent = body.Message ? JSON.parse(body.Message) : body;
      const handler = this.handlersByEventType.get(event.eventType);

      if (handler) {
        await handler.handle(event);
      }

      await this.client.send(new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: message.ReceiptHandle,
      }));
    } catch (err) {
      console.error(JSON.stringify({ level: 'error', message: 'saga_process_error', error: String(err) }));
    }
  }
}
