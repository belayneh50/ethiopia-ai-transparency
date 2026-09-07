import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@ethiopia-ai/shared-types';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
// Governors record the synthetic records the audit runs on, so they need the
// same read-side AI aid as admins/reviewers (viewers stay excluded).
@Roles(UserRole.admin, UserRole.reviewer, UserRole.governor)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('audit')
  audit(@Body() body: unknown) { return this.ai.audit(body); }

  @Post('guidance')
  guidance(@Body() body: unknown) { return this.ai.guidance(body); }
}
