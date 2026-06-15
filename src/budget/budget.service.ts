import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingEventsPublisher } from '../events/billing-events.publisher';
import { MercadoPagoService } from '../mercadopago/mercadopago.service';

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: BillingEventsPublisher,
    private readonly mercadoPago: MercadoPagoService,
  ) {}

  async createFromWorkOrder(workOrderId: number) {
    const existing = await this.prisma.budget.findUnique({ where: { workOrderId } });
    if (existing) return existing;

    const budget = await this.prisma.budget.create({
      data: { workOrderId, status: 'PENDENTE' },
    });
    this.logger.log(`Orçamento ${budget.id} criado para OS ${workOrderId}`);
    await this.publisher.publishBudgetGenerated({ workOrderId, totalAmount: 0 });
    return budget;
  }

  async addItems(workOrderId: number, items: { serviceId?: number; partId?: number; quantity: number }[]) {
    const budget = await this.findByWorkOrder(workOrderId);

    for (const item of items) {
      let unitPrice = 0;
      if (item.serviceId) {
        const svc = await this.prisma.serviceCatalog.findUniqueOrThrow({ where: { id: item.serviceId } });
        unitPrice = Number(svc.basePrice);
      } else if (item.partId) {
        const part = await this.prisma.part.findUniqueOrThrow({ where: { id: item.partId } });
        unitPrice = Number(part.unitPrice);
      }
      await this.prisma.budgetItem.create({
        data: { budgetId: budget.id, ...item, unitPrice },
      });
    }

    const updatedItems = await this.prisma.budgetItem.findMany({ where: { budgetId: budget.id } });
    const totalAmount = updatedItems.reduce((acc, i) => acc + Number(i.unitPrice) * i.quantity, 0);
    await this.prisma.budget.update({ where: { id: budget.id }, data: { totalAmount, sentAt: new Date() } });

    await this.publisher.publishBudgetGenerated({ workOrderId, totalAmount });
    return this.findByWorkOrder(workOrderId);
  }

  async approve(workOrderId: number) {
    const budget = await this.findByWorkOrder(workOrderId);
    await this.prisma.budget.update({
      where: { id: budget.id },
      data: { status: 'APROVADO', respondedAt: new Date() },
    });
    await this.publisher.publishBudgetApproved({ workOrderId, totalAmount: Number(budget.totalAmount) });
    return this.findByWorkOrder(workOrderId);
  }

  async reject(workOrderId: number) {
    const budget = await this.findByWorkOrder(workOrderId);
    await this.prisma.budget.update({
      where: { id: budget.id },
      data: { status: 'REJEITADO', respondedAt: new Date() },
    });
    await this.publisher.publishBudgetRejected({ workOrderId });
    return this.findByWorkOrder(workOrderId);
  }

  async initiatePayment(workOrderId: number) {
    const budget = await this.findByWorkOrder(workOrderId);

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
    return mpPayment;
  }

  async handleWebhook(mercadoPagoId: string, status: string) {
    const payment = await this.prisma.payment.findFirst({ where: { mercadoPagoId } });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');

    if (status === 'approved') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'APROVADO', mercadoPagoStatus: status, paidAt: new Date() },
      });
      await this.publisher.publishPaymentConfirmed({
        workOrderId: payment.workOrderId,
        mercadoPagoId,
      });
    } else if (['rejected', 'cancelled'].includes(status)) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FALHOU', mercadoPagoStatus: status },
      });
      await this.publisher.publishPaymentFailed({
        workOrderId: payment.workOrderId,
        reason: status,
      });
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
