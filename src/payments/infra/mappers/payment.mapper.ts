import { Payment } from '../../domain/entities/payment.entity';
import { PaymentMongoDocument } from '../mongo/payment.schema';

export class PaymentMapper {
  static toDomain(doc: PaymentMongoDocument): Payment {
    return new Payment({
      id: doc._id.toString(),
      workOrderId: doc.workOrderId,
      budgetId: doc.budgetId,
      amount: doc.amount,
      status: doc.status,
      mpPreferenceId: doc.mpPreferenceId,
      mpPaymentId: doc.mpPaymentId,
      paymentLink: doc.paymentLink,
      failureReason: doc.failureReason,
      createdAt: (doc as any).createdAt,
      confirmedAt: doc.confirmedAt,
    });
  }
}
