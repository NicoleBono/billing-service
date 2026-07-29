import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { BudgetModule } from './budget/budget.module';
import { SagaConsumerModule } from './saga/saga-consumer.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [PrismaModule, BudgetModule, SagaConsumerModule, HealthModule],
})
export class AppModule {}
