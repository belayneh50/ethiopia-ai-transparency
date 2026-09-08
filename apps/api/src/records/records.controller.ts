import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { RecordsService } from './records.service';
import { JwtAuthGuard, RolesGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@ethiopia-ai/shared-types';
export type Actor = { userId: string; role: string; name: string };
type AuthRequest = { user: Actor };
@Controller('records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecordsController {
  constructor(private readonly records: RecordsService) {}
  @Post()
  @Roles(UserRole.governor, UserRole.admin)
  create(@Request() req: AuthRequest, @Body() body: unknown) { return this.records.create(req.user.userId, body); }
  @Post('import')
  @Roles(UserRole.admin)
  import(@Request() req: AuthRequest, @Body() body: unknown) { return this.records.import(req.user.userId, body); }
  @Get()
  @Roles(UserRole.public, UserRole.reviewer, UserRole.governor, UserRole.admin)
  findAll(@Request() req: AuthRequest, @Query() query: Record<string, string>) { return this.records.findAll(query, req.user.role); }
  @Get(':id')
  @Roles(UserRole.public, UserRole.reviewer, UserRole.governor, UserRole.admin)
  findOne(@Request() req: AuthRequest, @Param('id') id: string) { return this.records.findOne(id, req.user.role); }
  @Patch(':id')
  @Roles(UserRole.governor, UserRole.admin)
  update(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: unknown) { return this.records.update(req.user, id, body); }
  @Post(':id/review')
  @Roles(UserRole.reviewer, UserRole.admin)
  review(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: unknown) { return this.records.review(req.user.userId, id, body); }
  @Post(':id/audit-signoff')
  @Roles(UserRole.reviewer, UserRole.admin)
  signOff(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: unknown) { return this.records.signOff(req.user.userId, id, body); }
  @Post(':id/comparables')
  @Roles(UserRole.reviewer, UserRole.admin)
  addComparable(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: unknown) { return this.records.addComparable(req.user.userId, id, body); }
  @Delete(':id/comparables/:comparableId')
  @Roles(UserRole.reviewer, UserRole.admin)
  removeComparable(@Request() req: AuthRequest, @Param('id') id: string, @Param('comparableId') cid: string, @Body() body: unknown) { return this.records.removeComparable(req.user.userId, id, cid, body); }
}
