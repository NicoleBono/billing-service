import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { PaymentStatus } from '../../domain/entities/payment.entity';

@Schema({ collection: 'payments', timestamps: true })
export class PaymentDocument {
  @Prop({ required: true, index: true }) workOrderId: number;
  @Prop({ required: true }) budgetId: string;
  @Prop({ required: true }) amount: number;
  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING }) status: PaymentStatus;
  @Prop() mpPreferenceId?: string;
  @Prop({ index: true }) mpPaymentId?: string;
  @Prop() paymentLink?: string;
  @Prop() failureReason?: string;
  @Prop() confirmedAt?: Date;
}

export type PaymentMongoDocument = HydratedDocument<PaymentDocument>;
export const PaymentSchema = SchemaFactory.createForClass(PaymentDocument);
