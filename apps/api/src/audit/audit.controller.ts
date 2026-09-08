import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard, RolesGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@ethiopia-ai/shared-types';
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.reviewer, UserRole.admin)
export class AuditController {
  constructor(private readonly audit: AuditService) {}
  @Get()
  findAll(@Query() query: Record<string, string>) { return this.audit.findAll(query); }
}
