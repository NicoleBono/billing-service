import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePaymentInput, PaymentRepository } from '../../domain/repositories/payment.repository';
import { Payment, PaymentStatus } from '../../domain/entities/payment.entity';
import { PaymentDocument, PaymentMongoDocument } from './payment.schema';
import { PaymentMapper } from '../mappers/payment.mapper';

@Injectable()
export class PaymentMongoRepository extends PaymentRepository {
  constructor(@InjectModel(PaymentDocument.name) private readonly model: Model<PaymentMongoDocument>) {
    super();
  }

  async create(input: CreatePaymentInput): Promise<Payment> {
    const created = await this.model.create({
      workOrderId: input.workOrderId,
      budgetId: input.budgetId,
      amount: input.amount,
      mpPreferenceId: input.mpPreferenceId,
      paymentLink: input.paymentLink,
      status: PaymentStatus.PENDING,
    });

    return PaymentMapper.toDomain(created);
  }

  async findLatestByWorkOrderId(workOrderId: number): Promise<Payment | null> {
    const doc = await this.model.findOne({ workOrderId }).sort({ createdAt: -1 }).exec();
    return doc ? PaymentMapper.toDomain(doc) : null;
  }

  async findByMpPaymentId(mpPaymentId: string): Promise<Payment | null> {
    const doc = await this.model.findOne({ mpPaymentId }).exec();
    return doc ? PaymentMapper.toDomain(doc) : null;
  }

  async linkMpPaymentId(id: string, mpPaymentId: string): Promise<Payment> {
    const doc = await this.model.findByIdAndUpdate(id, { mpPaymentId }, { new: true }).exec();
    if (!doc) throw new NotFoundException('Pagamento não encontrado');
    return PaymentMapper.toDomain(doc);
  }

  async markConfirmed(id: string): Promise<Payment> {
    const doc = await this.model
      .findByIdAndUpdate(id, { status: PaymentStatus.CONFIRMED, confirmedAt: new Date() }, { new: true })
      .exec();
    if (!doc) throw new NotFoundException('Pagamento não encontrado');
    return PaymentMapper.toDomain(doc);
  }

  async markFailed(id: string, reason: string): Promise<Payment> {
    const doc = await this.model
      .findByIdAndUpdate(id, { status: PaymentStatus.FAILED, failureReason: reason }, { new: true })
      .exec();
    if (!doc) throw new NotFoundException('Pagamento não encontrado');
    return PaymentMapper.toDomain(doc);
  }
}
