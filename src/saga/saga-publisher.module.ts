import { Module } from '@nestjs/common';
import { SagaPublisherService } from './publisher/saga-publisher.service';

@Module({
  providers: [SagaPublisherService],
  exports: [SagaPublisherService],
})
export class SagaPublisherModule {}
