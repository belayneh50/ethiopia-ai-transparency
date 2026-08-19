import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@ethiopia-ai/shared-types';

@Controller('audit')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.reviewer, UserRole.governor, UserRole.admin)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll(@Query() query: any, @Request() req) {
    if (req.user.role !== UserRole.admin && req.user.role !== UserRole.governor) {
      return this.auditService.findAll({
        ...query,
        actorId: req.user.userId,
      });
    }

    return this.auditService.findAll(query);
  }
}