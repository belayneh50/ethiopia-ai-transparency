import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { AuditService } from './audit.service';
import { JwtAuthGuard, RolesGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@ethiopia-ai/shared-types';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
// Audit log access is internal (admin + reviewer); recorder/governor is denied.
@Roles(UserRole.reviewer, UserRole.admin)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll(@Query() query: any, @Request() req: ExpressRequest) {
    const user = (req as any).user;
    if (user.role !== UserRole.admin && user.role !== UserRole.governor) {
      return this.auditService.findAll({
        ...query,
        actorId: user.userId,
      });
    }

    return this.auditService.findAll(query);
  }
}