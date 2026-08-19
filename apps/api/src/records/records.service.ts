import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecordDto, ReviewRecordDto, ComparableDto } from './records.controller';
import { AuditService } from '../audit/audit.service';
import { ReviewStatus } from '@ethiopia-ai/shared-types';

@Injectable()
export class RecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(userId: string, dto: CreateRecordDto) {
    const daysOpen = this.calculateDaysOpen(dto.approvalDate, dto.paymentDate);
    const signals = this.detectSignals(dto.value, dto.supplier, daysOpen, []);
    
    const record = await this.prisma.record.create({
      data: {
        recordId: `SYN-ET-${Date.now().toString(36).toUpperCase()}`,
        ...dto,
        daysOpen,
        signals,
      },
      include: { comparables: true },
    });

    await this.auditService.log({
      action: 'create',
      entityType: 'record',
      entityId: record.id,
      changes: { before: null, after: record },
      performedBy: userId,
    });

    return record;
  }

  async findAll(query: any) {
    const { page = 1, limit = 20, category, status, reviewStatus, search, sortBy = 'createdAt', order = 'desc' } = query;
    
    const where: any = {};
    if (category) where.category = { contains: category, mode: 'insensitive' };
    if (status) where.status = status;
    if (reviewStatus) where.reviewStatus = reviewStatus;
    if (search) {
      where.OR = [
        { item: { contains: search, mode: 'insensitive' } },
        { itemAm: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
        { buyer: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [records, total] = await Promise.all([
      this.prisma.record.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: order },
        include: { comparables: true, geminiGuidance: true },
      }),
      this.prisma.record.count({ where }),
    ]);

    return {
      data: records,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const record = await this.prisma.record.findUnique({
      where: { id },
      include: { comparables: true, geminiGuidance: true },
    });

    if (!record) throw new NotFoundException('Record not found');
    return record;
  }

  async review(userId: string, id: string, dto: ReviewRecordDto) {
    const record = await this.prisma.record.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Record not found');

    const updated = await this.prisma.record.update({
      where: { id },
      data: {
        reviewStatus: dto.reviewStatus,
        reviewNote: dto.reviewNote,
        reviewDate: new Date().toISOString(),
        reviewedBy: userId,
      },
      include: { comparables: true },
    });

    await this.auditService.log({
      action: 'review',
      entityType: 'review',
      entityId: id,
      changes: { before: { reviewStatus: record.reviewStatus }, after: { reviewStatus: dto.reviewStatus } },
      performedBy: userId,
    });

    return updated;
  }

  async addComparable(userId: string, recordId: string, dto: ComparableDto) {
    const record = await this.prisma.record.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException('Record not found');

    const comparable = await this.prisma.comparableListing.create({
      data: {
        recordId,
        ...dto,
      },
    });

    await this.auditService.log({
      action: 'update',
      entityType: 'comparable',
      entityId: comparable.id,
      changes: { after: comparable },
      performedBy: userId,
    });

    return comparable;
  }

  async removeComparable(userId: string, recordId: string, comparableId: string) {
    const comparable = await this.prisma.comparableListing.findFirst({
      where: { id: comparableId, recordId },
    });

    if (!comparable) throw new NotFoundException('Comparable not found');

    await this.prisma.comparableListing.delete({ where: { id: comparableId } });

    await this.auditService.log({
      action: 'delete',
      entityType: 'comparable',
      entityId: comparableId,
      changes: { before: comparable, after: null },
      performedBy: userId,
    });

    return { deleted: true };
  }

  async import(userId: string, records: any[]) {
    const results = [];
    
    for (const record of records) {
      const created = await this.create(userId, record);
      results.push(created);
    }

    await this.auditService.log({
      action: 'create',
      entityType: 'record',
      entityId: 'bulk',
      changes: { count: records.length },
      performedBy: userId,
    });

    return { imported: results.length };
  }

  private calculateDaysOpen(approvalDate: string, paymentDate: string): number {
    const start = new Date(approvalDate);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private detectSignals(value: number, supplier: string, daysOpen: number, existingSignals: string[]): string[] {
    const signals = [...existingSignals];
    if (value > 1_500_000) signals.push('price');
    if (daysOpen > 30) signals.push('delay');
    return signals;
  }
}