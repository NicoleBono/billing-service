import { Module } from '@nestjs/common';
import { MongoModule } from './mongo/mongo.module';
import { BudgetsModule } from './budgets/budgets.module';
import { PaymentsModule } from './payments/payments.module';
import { HealthModule } from './health/health.module';
import { SagaConsumerModule } from './saga/saga-consumer.module';

@Module({
  imports: [MongoModule, BudgetsModule, PaymentsModule, HealthModule, SagaConsumerModule],
})
export class AppModule {}
