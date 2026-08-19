import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { RecordsService } from './records.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
@UseGuards(JwtAuthGuard)
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  @Roles(UserRole.reviewer, UserRole.governor, UserRole.admin)
  async create(@Request() req, @Body() dto: CreateRecordDto) {
    return this.recordsService.create(req.user.userId, dto);
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

  @Post(':id/review')
  @Roles(UserRole.reviewer, UserRole.governor, UserRole.admin)
  async review(@Request() req, @Param('id') id: string, @Body() dto: ReviewRecordDto) {
    return this.recordsService.review(req.user.userId, id, dto);
  }

  @Post(':id/comparables')
  @Roles(UserRole.reviewer, UserRole.governor, UserRole.admin)
  async addComparable(@Request() req, @Param('id') id: string, @Body() dto: ComparableDto) {
    return this.recordsService.addComparable(req.user.userId, id, dto);
  }

  @Delete(':id/comparables/:comparableId')
  @Roles(UserRole.reviewer, UserRole.governor, UserRole.admin)
  async removeComparable(@Request() req, @Param('id') id: string, @Param('comparableId') comparableId: string) {
    return this.recordsService.removeComparable(req.user.userId, id, comparableId);
  }

  @Post('import')
  @Roles(UserRole.admin)
  async import(@Request() req, @Body() body: { records: any[] }) {
    return this.recordsService.import(req.user.userId, body.records);
  }
}