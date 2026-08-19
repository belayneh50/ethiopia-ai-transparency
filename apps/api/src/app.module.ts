import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {RecordsModule} from './records/records.module';
import {ReviewsModule} from './reviews/reviews.module';
import {AuthModule} from './auth/auth.module';
import {AuditModule} from './audit/audit.module';
import {PrismaModule} from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RecordsModule,
    ReviewsModule,
    AuthModule,
    AuditModule,
  ],
})
export class AppModule {}