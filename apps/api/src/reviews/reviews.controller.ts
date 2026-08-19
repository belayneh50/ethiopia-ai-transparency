import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@ethiopia-ai/shared-types';

class RequestGuidanceDto {
  language!: 'am' | 'en' | 'both';
}

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('record/:recordId')
  @Roles(UserRole.reviewer, UserRole.governor, UserRole.admin)
  async findByRecord(@Param('recordId') recordId: string) {
    return this.reviewsService.findByRecord(recordId);
  }

  @Post('record/:recordId/guidance')
  @Roles(UserRole.reviewer, UserRole.governor, UserRole.admin)
  async requestGuidance(@Request() req: ExpressRequest, @Param('recordId') recordId: string, @Body() dto: RequestGuidanceDto) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - `user` is added by authentication middleware
    return this.reviewsService.requestGuidance((req as any).user.userId, recordId, dto.language);
  }
}