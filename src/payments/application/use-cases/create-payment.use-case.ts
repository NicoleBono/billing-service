import { Inject, Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../domain/repositories/payment.repository';
import { MercadoPagoClient } from '../../infra/mercadopago/mercadopago.client';

export type CreatePaymentCommand = {
  workOrderId: number;
  budgetId: string;
  amount: number;
};

@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject(PaymentRepository)
    private readonly repository: PaymentRepository,
    private readonly mercadoPago: MercadoPagoClient,
  ) {}

  async execute(command: CreatePaymentCommand) {
    const preference = await this.mercadoPago.createPreference(command.workOrderId, command.amount);

    return this.repository.create({
      workOrderId: command.workOrderId,
      budgetId: command.budgetId,
      amount: command.amount,
      mpPreferenceId: preference.preferenceId,
      paymentLink: preference.paymentLink,
    });
  }
}
