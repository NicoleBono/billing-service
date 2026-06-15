import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class BillingEventsPublisher {
  constructor(private readonly amqp: AmqpConnection) {}

  async publishBudgetGenerated(payload: { workOrderId: number; totalAmount: number }) {
    await this.amqp.publish('oficina.events', 'budget.generated', payload);
  }

  async publishBudgetApproved(payload: { workOrderId: number; totalAmount: number }) {
    await this.amqp.publish('oficina.events', 'budget.approved', payload);
  }

  async publishBudgetRejected(payload: { workOrderId: number }) {
    await this.amqp.publish('oficina.events', 'budget.rejected', payload);
  }

  async publishPaymentConfirmed(payload: { workOrderId: number; mercadoPagoId: string }) {
    await this.amqp.publish('oficina.events', 'payment.confirmed', payload);
  }

  async publishPaymentFailed(payload: { workOrderId: number; reason: string }) {
    await this.amqp.publish('oficina.events', 'payment.failed', payload);
  }
}
