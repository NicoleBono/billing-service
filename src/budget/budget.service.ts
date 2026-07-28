import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SagaPublisherService } from '../saga/publisher/saga-publisher.service';
import { SagaEventType } from '../saga/types/saga-event.types';
import { MercadoPagoService } from '../mercadopago/mercadopago.service';

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly saga: SagaPublisherService,
    private readonly mercadoPago: MercadoPagoService,
  ) {}

  async createFromWorkOrder(workOrderId: number) {
    const existing = await this.prisma.budget.findUnique({ where: { workOrderId } });
    if (existing) return existing;

    const budget = await this.prisma.budget.create({
      data: { workOrderId, status: 'PENDENTE' },
    });
    this.logger.log(`Orçamento ${budget.id} criado para OS ${workOrderId}`);
    await this.saga.publish(SagaEventType.BUDGET_GENERATED, workOrderId, { totalAmount: 0 });
    return budget;
  }

  async handleApprovalDecided(workOrderId: number, approved: boolean) {
    const budget = await this.findByWorkOrder(workOrderId);

    if (approved) {
      await this.prisma.budget.update({
        where: { id: budget.id },
        data: { status: 'APROVADO', respondedAt: new Date() },
      });

      const mpPayment = await this.mercadoPago.createPaymentLink({
        workOrderId,
        amount: Number(budget.totalAmount),
      });

      await this.prisma.payment.create({
        data: {
          budgetId: budget.id,
          workOrderId,
          amount: budget.totalAmount,
          status: 'AGUARDANDO',
          mercadoPagoId: mpPayment.id,
          mercadoPagoPaymentUrl: mpPayment.paymentUrl,
        },
      });

      this.logger.log(`Pagamento criado no MP para OS ${workOrderId}: ${mpPayment.paymentUrl}`);
      await this.saga.publish(SagaEventType.EXECUTION_REQUESTED, workOrderId, {
        paymentUrl: mpPayment.paymentUrl,
      });
    } else {
      await this.prisma.budget.update({
        where: { id: budget.id },
        data: { status: 'REJEITADO', respondedAt: new Date() },
      });
      await this.saga.publish(SagaEventType.PAYMENT_FAILED, workOrderId, { reason: 'budget_rejected' });
    }
  }

  async handleExecutionCompleted(workOrderId: number) {
    const payment = await this.prisma.payment.findUnique({ where: { workOrderId } });
    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'APROVADO', paidAt: new Date() },
      });
    }
    await this.saga.publish(SagaEventType.PAYMENT_CONFIRMED, workOrderId, {});
  }

  async handleWebhook(mercadoPagoId: string, status: string) {
    const payment = await this.prisma.payment.findFirst({ where: { mercadoPagoId } });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');

    if (status === 'approved') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'APROVADO', mercadoPagoStatus: status, paidAt: new Date() },
      });
      await this.saga.publish(SagaEventType.PAYMENT_CONFIRMED, payment.workOrderId, { mercadoPagoId });
    } else if (['rejected', 'cancelled'].includes(status)) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FALHOU', mercadoPagoStatus: status },
      });
      await this.saga.publish(SagaEventType.PAYMENT_FAILED, payment.workOrderId, { reason: status });
    }
  }

  async findByWorkOrder(workOrderId: number) {
    const budget = await this.prisma.budget.findUnique({
      where: { workOrderId },
      include: { items: { include: { service: true, part: true } }, payment: true },
    });
    if (!budget) throw new NotFoundException(`Orçamento para OS ${workOrderId} não encontrado`);
    return budget;
  }
}
