import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BudgetRepository, CreateBudgetInput } from '../../domain/repositories/budget.repository';
import { Budget, BudgetStatus } from '../../domain/entities/budget.entity';
import { BudgetDocument, BudgetMongoDocument } from './budget.schema';
import { BudgetMapper } from '../mappers/budget.mapper';

@Injectable()
export class BudgetMongoRepository extends BudgetRepository {
  constructor(@InjectModel(BudgetDocument.name) private readonly model: Model<BudgetMongoDocument>) {
    super();
  }

  async create(input: CreateBudgetInput): Promise<Budget> {
    const created = await this.model.create({
      workOrderId: input.workOrderId,
      services: input.services,
      parts: input.parts,
      amount: input.amount,
      status: BudgetStatus.PENDING,
    });

    return BudgetMapper.toDomain(created);
  }

  async findLatestByWorkOrderId(workOrderId: number): Promise<Budget | null> {
    const doc = await this.model.findOne({ workOrderId }).sort({ createdAt: -1 }).exec();
    return doc ? BudgetMapper.toDomain(doc) : null;
  }

  async markApproved(id: string): Promise<Budget> {
    const doc = await this.model.findByIdAndUpdate(id, { status: BudgetStatus.APPROVED }, { new: true }).exec();
    if (!doc) throw new NotFoundException('Orçamento não encontrado');
    return BudgetMapper.toDomain(doc);
  }

  async markVoid(id: string): Promise<Budget> {
    const doc = await this.model.findByIdAndUpdate(id, { status: BudgetStatus.VOID }, { new: true }).exec();
    if (!doc) throw new NotFoundException('Orçamento não encontrado');
    return BudgetMapper.toDomain(doc);
  }
}
