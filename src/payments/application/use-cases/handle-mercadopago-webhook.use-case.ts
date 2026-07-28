import { Inject, Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../domain/repositories/payment.repository';
import { MercadoPagoClient } from '../../infra/mercadopago/mercadopago.client';
import { SagaPublisherService } from '../../../saga/publisher/saga-publisher.service';
import { SagaEventType } from '../../../saga/types/saga-event.types';
import { NotFoundError } from '../../../common/errors/domain.errors';

const APPROVED_STATUSES = new Set(['approved']);
const FAILED_STATUSES = new Set(['rejected', 'cancelled', 'refunded']);

@Injectable()
export class HandleMercadoPagoWebhookUseCase {
  constructor(
    @Inject(PaymentRepository)
    private readonly repository: PaymentRepository,
    private readonly mercadoPago: MercadoPagoClient,
    private readonly sagaPublisher: SagaPublisherService,
  ) {}

  async execute(mpPaymentId: string): Promise<void> {
    const details = await this.mercadoPago.getPaymentDetails(mpPaymentId);

    const payment = await this.repository.findLatestByWorkOrderId(details.workOrderId);
    if (!payment?.id) {
      throw new NotFoundError(`Nenhum pagamento pendente encontrado para a OS ${details.workOrderId}`);
    }

    await this.repository.linkMpPaymentId(payment.id, mpPaymentId);

    if (APPROVED_STATUSES.has(details.status)) {
      await this.repository.markConfirmed(payment.id);
      await this.sagaPublisher.publish(SagaEventType.PAYMENT_CONFIRMED, details.workOrderId, {});
      return;
    }

    if (FAILED_STATUSES.has(details.status)) {
      const reason = details.statusDetail || `pagamento ${details.status}`;
      await this.repository.markFailed(payment.id, reason);
      await this.sagaPublisher.publish(SagaEventType.PAYMENT_FAILED, details.workOrderId, { reason });
      return;
    }

    // pending / in_process: aguarda próxima notificação do Mercado Pago.
  }
}
