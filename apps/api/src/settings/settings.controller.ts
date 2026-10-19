import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { UserRole } from '@ethiopia-ai/shared-types';
import { JwtAuthGuard, RolesGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { SettingsService } from './settings.service';

@Controller('settings/thresholds')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @Roles(UserRole.public, UserRole.reviewer, UserRole.governor, UserRole.admin)
  get() { return this.settings.get(); }

  @Patch()
  @Roles(UserRole.admin)
  update(@Request() req: { user: { userId: string } }, @Body() body: unknown) {
    return this.settings.update(req.user.userId, body);
  }
}
