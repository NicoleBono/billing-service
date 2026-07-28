import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DATABASE_URL || 'mongodb://localhost:27017/billing'),
  ],
  exports: [MongooseModule],
})
export class MongoModule {}
