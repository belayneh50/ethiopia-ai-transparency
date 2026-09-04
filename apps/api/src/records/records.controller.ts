import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Delete } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { RecordsService } from './records.service';
import { JwtAuthGuard, RolesGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, ReviewStatus } from '@ethiopia-ai/shared-types';

export class CreateRecordDto {
  item!: string;
  itemAm!: string;
  category!: string;
  categoryAm!: string;
  buyer!: string;
  supplier!: string;
  value!: number;
  bids!: number;
  approvalDate!: string;
  paymentDate!: string;
  status!: string;
  statusAm!: string;
  date?: string;
}

export class ReviewRecordDto {
  reviewStatus!: ReviewStatus;
  reviewNote?: string;
  signals?: string[];
}

export class ComparableDto {
  item!: string;
  itemAm?: string;
  condition!: string;
  conditionAm?: string;
  price!: number;
  sourceUrl!: string;
  observationDate!: string;
  note!: string;
  noteAm?: string;
}

@Controller('records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  // Matches the portal's 'addEditRecord' capability (admin + recorder/governor).
  @Post()
  @Roles(UserRole.governor, UserRole.admin)
  async create(@Request() req: ExpressRequest, @Body() dto: CreateRecordDto) {
    return this.recordsService.create((req as any).user.userId, dto);
  }

  @Get()
  @Roles(UserRole.public, UserRole.reviewer, UserRole.governor, UserRole.admin)
  async findAll(@Query() query: any) {
    return this.recordsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.public, UserRole.reviewer, UserRole.governor, UserRole.admin)
  async findOne(@Param('id') id: string) {
    return this.recordsService.findOne(id);
  }

  // Matches the portal's 'performHumanReview' capability (admin + reviewer).
  @Post(':id/review')
  @Roles(UserRole.reviewer, UserRole.admin)
  async review(@Request() req: ExpressRequest, @Param('id') id: string, @Body() dto: ReviewRecordDto) {
    return this.recordsService.review((req as any).user.userId, id, dto);
  }

  // Matches the portal's 'addVerifyComparable' capability (admin + reviewer).
  @Post(':id/comparables')
  @Roles(UserRole.reviewer, UserRole.admin)
  async addComparable(@Request() req: ExpressRequest, @Param('id') id: string, @Body() dto: ComparableDto) {
    return this.recordsService.addComparable((req as any).user.userId, id, dto);
  }

  // Matches the portal's 'addVerifyComparable' capability (admin + reviewer).
  @Delete(':id/comparables/:comparableId')
  @Roles(UserRole.reviewer, UserRole.admin)
  async removeComparable(@Request() req: ExpressRequest, @Param('id') id: string, @Param('comparableId') comparableId: string) {
    return this.recordsService.removeComparable((req as any).user.userId, id, comparableId);
  }

  @Post('import')
  @Roles(UserRole.admin)
  async import(@Request() req: ExpressRequest, @Body() body: { records: any[] }) {
    return this.recordsService.import((req as any).user.userId, body.records);
  }
}