import { Payment } from '../entities/payment.entity';

export type CreatePaymentInput = {
  workOrderId: number;
  budgetId: string;
  amount: number;
  mpPreferenceId: string;
  paymentLink: string;
};

export abstract class PaymentRepository {
  abstract create(input: CreatePaymentInput): Promise<Payment>;
  abstract findLatestByWorkOrderId(workOrderId: number): Promise<Payment | null>;
  abstract findByMpPaymentId(mpPaymentId: string): Promise<Payment | null>;
  abstract linkMpPaymentId(id: string, mpPaymentId: string): Promise<Payment>;
  abstract markConfirmed(id: string): Promise<Payment>;
  abstract markFailed(id: string, reason: string): Promise<Payment>;
}
