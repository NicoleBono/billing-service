import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { BudgetModule } from './budget/budget.module';
import { SagaConsumerModule } from './saga/saga-consumer.module';

@Module({
  imports: [PrismaModule, BudgetModule, SagaConsumerModule],
})
export class AppModule {}
