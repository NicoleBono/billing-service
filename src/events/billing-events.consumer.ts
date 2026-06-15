import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { BudgetService } from '../budget/budget.service';

@Injectable()
export class BillingEventsConsumer {
  private readonly logger = new Logger(BillingEventsConsumer.name);

  constructor(private readonly budgetService: BudgetService) {}

  @RabbitSubscribe({
    exchange: 'oficina.events',
    routingKey: 'os.created',
    queue: 'billing-service.os-created',
  })
  async onOsCreated(msg: { workOrderId: number; customerId: number; vehicleId: number; description?: string }) {
    this.logger.log(`OS criada recebida: ${msg.workOrderId}`);
    await this.budgetService.createFromWorkOrder(msg.workOrderId);
  }

  @RabbitSubscribe({
    exchange: 'oficina.events',
    routingKey: 'execution.finished',
    queue: 'billing-service.execution-finished',
  })
  async onExecutionFinished(msg: { workOrderId: number }) {
    this.logger.log(`Execução finalizada, iniciando cobrança: ${msg.workOrderId}`);
    await this.budgetService.initiatePayment(msg.workOrderId);
  }
}
