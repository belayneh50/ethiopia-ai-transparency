import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import {RecordsModule} from './records/records.module';
import {ReviewsModule} from './reviews/reviews.module';
import {AuthModule} from './auth/auth.module';
import {AuditModule} from './audit/audit.module';
import {PrismaModule} from './prisma/prisma.module';
import { AiModule } from './ai/ai.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    // Both dev (`pnpm --filter api dev`) and prod (`node dist/main`) run with
    // cwd = apps/api, so the repo root is two levels up. Root .env is read
    // first: the documented .env.example layout keeps GEMINI_API_KEY there;
    // the package-local .env still applies for its own keys, and existing
    // process.env always wins over both.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [path.resolve(process.cwd(), '../../.env'), path.resolve(process.cwd(), '.env')],
    }),
    PrismaModule,
    RecordsModule,
    ReviewsModule,
    AuthModule,
    AuditModule,
    AiModule,
    SettingsModule,
  ],
})
export class AppModule {}
