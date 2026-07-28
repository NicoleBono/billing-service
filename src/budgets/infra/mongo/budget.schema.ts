import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BudgetStatus } from '../../domain/entities/budget.entity';

@Schema({ _id: false })
class BudgetItemSchema {
  @Prop() serviceId?: number;
  @Prop() partId?: number;
  @Prop({ required: true }) quantity: number;
}

@Schema({ collection: 'budgets', timestamps: true })
export class BudgetDocument {
  @Prop({ required: true, index: true }) workOrderId: number;
  @Prop({ type: [BudgetItemSchema], default: [] }) services: BudgetItemSchema[];
  @Prop({ type: [BudgetItemSchema], default: [] }) parts: BudgetItemSchema[];
  @Prop({ required: true }) amount: number;
  @Prop({ required: true, enum: BudgetStatus, default: BudgetStatus.PENDING }) status: BudgetStatus;
}

export type BudgetMongoDocument = HydratedDocument<BudgetDocument>;
export const BudgetSchema = SchemaFactory.createForClass(BudgetDocument);
