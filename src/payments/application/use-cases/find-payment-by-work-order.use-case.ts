import { Inject, Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../domain/repositories/payment.repository';
import { NotFoundError } from '../../../common/errors/domain.errors';

@Injectable()
export class FindPaymentByWorkOrderUseCase {
  constructor(
    @Inject(PaymentRepository)
    private readonly repository: PaymentRepository,
  ) {}

  async execute(workOrderId: number) {
    const payment = await this.repository.findLatestByWorkOrderId(workOrderId);
    if (!payment) {
      throw new NotFoundError(`Nenhum pagamento encontrado para a OS ${workOrderId}`);
    }
    return payment;
  }
}
