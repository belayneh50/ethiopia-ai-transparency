import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@ethiopia-ai/shared-types';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
// AI review is reserved for Admin and Reviewer, matching the portal capability.
@Roles(UserRole.admin, UserRole.reviewer)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('audit')
  audit(@Body() body: unknown) { return this.ai.audit(body); }

  @Post('guidance')
  guidance(@Body() body: unknown) { return this.ai.guidance(body); }
}
