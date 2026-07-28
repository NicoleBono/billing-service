import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BudgetDocument, BudgetSchema } from './infra/mongo/budget.schema';
import { BudgetMongoRepository } from './infra/mongo/budget.mongo.repository';
import { BudgetRepository } from './domain/repositories/budget.repository';
import { BudgetsController } from './infra/controllers/budgets.controller';
import { CreateBudgetUseCase } from './application/use-cases/create-budget.use-case';
import { VoidBudgetUseCase } from './application/use-cases/void-budget.use-case';
import { ApproveBudgetUseCase } from './application/use-cases/approve-budget.use-case';
import { FindBudgetByWorkOrderUseCase } from './application/use-cases/find-budget-by-work-order.use-case';
import { SagaPublisherModule } from '../saga/saga-publisher.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: BudgetDocument.name, schema: BudgetSchema }]), SagaPublisherModule],
  controllers: [BudgetsController],
  providers: [
    CreateBudgetUseCase,
    VoidBudgetUseCase,
    ApproveBudgetUseCase,
    FindBudgetByWorkOrderUseCase,
    BudgetMongoRepository,
    { provide: BudgetRepository, useExisting: BudgetMongoRepository },
  ],
  exports: [BudgetRepository, CreateBudgetUseCase, VoidBudgetUseCase, ApproveBudgetUseCase],
})
export class BudgetsModule {}
