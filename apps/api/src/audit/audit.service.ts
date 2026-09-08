import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  // Legacy guidance events. Record/review/comparable writes use a transaction in RecordsService.
  async log(params: { action: string; entityType: string; entityId: string; changes?: Prisma.InputJsonValue; performedBy?: string; recordId?: string }) {
    return this.prisma.auditLog.create({ data: params });
  }
  async findAll(query: Record<string, string>) {
    const page = Number(query.page ?? 1), limit = Number(query.limit ?? 50);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new BadRequestException('Invalid pagination');
    const where: Prisma.AuditLogWhereInput = {};
    if (query.actorId) where.performedBy = query.actorId;
    if (query.recordId) where.recordId = query.recordId;
    if (query.action) where.action = query.action;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
      this.prisma.auditLog.count({ where }),
    ]);
    const users = await this.prisma.user.findMany({ where: { id: { in: data.flatMap(d => d.performedBy ? [d.performedBy] : []) } }, select: { id: true, name: true } });
    return { data: data.map(d => ({ ...d, actorName: users.find(u => u.id === d.performedBy)?.name ?? d.performedBy ?? 'Legacy event' })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
