import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { BillingEventsPublisher } from './billing-events.publisher';
import { BillingEventsConsumer } from './billing-events.consumer';

@Module({
  imports: [
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      useFactory: () => ({
        exchanges: [{ name: 'oficina.events', type: 'topic' }],
        uri: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
        connectionInitOptions: { wait: false },
        enableControllerDiscovery: true,
      }),
    }),
  ],
  providers: [BillingEventsPublisher, BillingEventsConsumer],
  exports: [RabbitMQModule, BillingEventsPublisher],
})
export class EventsModule {}
