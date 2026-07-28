import { Budget } from '../../domain/entities/budget.entity';
import { BudgetMongoDocument } from '../mongo/budget.schema';

export class BudgetMapper {
  static toDomain(doc: BudgetMongoDocument): Budget {
    return new Budget({
      id: doc._id.toString(),
      workOrderId: doc.workOrderId,
      services: doc.services,
      parts: doc.parts,
      amount: doc.amount,
      status: doc.status,
      createdAt: (doc as any).createdAt,
      updatedAt: (doc as any).updatedAt,
    });
  }
}
