import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Record as DbRecord } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { asObject, parseComparable, parseRecord, reviewStatus, text, version } from './record-input';
import type { Actor } from './records.controller';
import { adaptTransparencyAuditText } from '@ethiopia-ai/shared-types/transparency';
const include = { comparables: true } as const;
function json(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
function internal(role: string) { return role === 'admin' || role === 'reviewer'; }
function redact<T extends DbRecord>(record: T, role: string) {
  return internal(role) ? record : { ...record, reviewNote: null, reviewedBy: null, reviewDate: null, ...(role === 'governor' ? { comparables: [] } : {}) };
}
@Injectable()
export class RecordsService {
  constructor(private readonly prisma: PrismaService) {}

  private async event(tx: Prisma.TransactionClient, actor: string, recordId: string, action: string, entityType: string, entityId: string, before: unknown, after: unknown) {
    await tx.auditLog.create({ data: { recordId, action, entityType, entityId, performedBy: actor, changes: json({ before, after }) } });
  }
  private async transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    try { return await this.prisma.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 }); }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002'].includes(error.code)) throw new ConflictException('Concurrent change or duplicate. Refresh and retry.');
      throw error;
    }
  }
  private async existing(tx: Prisma.TransactionClient, id: string) {
    const record = await tx.record.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Record not found');
    return record;
  }
  private async bump(tx: Prisma.TransactionClient, id: string, expected: number) {
    const updated = await tx.record.updateMany({ where: { id, version: expected }, data: { version: { increment: 1 } } });
    if (updated.count !== 1) throw new ConflictException('This record changed. Refresh before saving.');
  }
  private signals(value: number, daysOpen: number) { return [...(value > 1500000 ? ['price'] : []), ...(daysOpen > 30 ? ['delay'] : [])]; }
  async create(userId: string, body: unknown) {
    const data = parseRecord(body);
    return this.transaction(async tx => {
      const record = await tx.record.create({ data: { ...data, recordId: `SYN-ET-${randomUUID()}`, createdBy: userId, signals: this.signals(data.value, data.daysOpen) }, include });
      await this.event(tx, userId, record.id, 'create', 'record', record.id, null, record);
      return record;
    });
  }
  async findAll(query: Record<string, string>, role = 'admin') {
    const page = Number(query.page ?? 1), limit = Number(query.limit ?? 100);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new BadRequestException('Invalid pagination');
    const where: Prisma.RecordWhereInput = {};
    if (query.search) where.OR = ['item', 'buyer', 'supplier'].map(key => ({ [key]: { contains: query.search, mode: 'insensitive' } }));
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.record.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { recordId: 'asc' }, include }),
      this.prisma.record.count({ where }),
    ]);
    return { data: rows.map(r => redact(r, role)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
  async findOne(id: string, role = 'admin') {
    const record = await this.prisma.record.findUnique({ where: { id }, include });
    if (!record) throw new NotFoundException('Record not found');
    return redact(record, role);
  }
  async update(actor: Actor, id: string, body: unknown) {
    const b = asObject(body);
    return this.transaction(async tx => {
      const before = await this.existing(tx, id);
      if (actor.role !== 'admin' && before.createdBy !== actor.userId) throw new ForbiddenException('Recorder may edit only their own records');
      const data = parseRecord(b);
      await this.bump(tx, id, version(b));
      const after = await tx.record.update({ where: { id }, data: { ...data, signals: this.signals(data.value, data.daysOpen) }, include });
      await this.event(tx, actor.userId, id, 'update', 'record', id, before, after);
      return redact(after, actor.role);
    });
  }
  async review(userId: string, id: string, body: unknown) {
    return this.transaction(async tx => {
      const before = await this.existing(tx, id);
      const b = asObject(body);
      await this.bump(tx, id, version(b));
      const after = await tx.record.update({ where: { id }, data: {
        reviewStatus: reviewStatus(b.reviewStatus), reviewNote: text(b.reviewNote, 'reviewNote', true),
        publicReviewSummary: b.publicReviewSummary === undefined ? before.publicReviewSummary : text(b.publicReviewSummary, 'publicReviewSummary', true),
        reviewedBy: userId, reviewDate: new Date().toISOString(),
      }, include });
      await this.event(tx, userId, id, 'review', 'review', id,
        { reviewStatus: before.reviewStatus, reviewNote: before.reviewNote, reviewedBy: before.reviewedBy, reviewDate: before.reviewDate, publicReviewSummary: before.publicReviewSummary },
        { reviewStatus: after.reviewStatus, reviewNote: after.reviewNote, reviewedBy: after.reviewedBy, reviewDate: after.reviewDate, publicReviewSummary: after.publicReviewSummary });
      return after;
    });
  }
  async addComparable(userId: string, id: string, body: unknown) {
    return this.transaction(async tx => {
      await this.existing(tx, id);
      const b = asObject(body);
      await this.bump(tx, id, version(b));
      if (await tx.comparableListing.count({ where: { recordId: id } }) >= 5) throw new BadRequestException('Maximum five comparables per record');
      const after = await tx.comparableListing.create({ data: { ...parseComparable(b), recordId: id } });
      await this.event(tx, userId, id, 'create', 'comparable', after.id, null, after);
      return tx.record.findUniqueOrThrow({ where: { id }, include });
    });
  }
  async signOff(userId: string, id: string, body: unknown) {
    const b = asObject(body);
    const raw = asObject(b.report);
    if (raw.source !== 'gemini' && raw.source !== 'fallback') throw new BadRequestException('Invalid report source');
    let report;
    try { report = { ...adaptTransparencyAuditText(JSON.stringify(raw), 'both'), source: raw.source }; }
    catch { throw new BadRequestException('Invalid bilingual report'); }
    return this.transaction(async tx => {
      await this.existing(tx, id);
      await this.bump(tx, id, version(b));
      await this.event(tx, userId, id, 'audit-signoff', 'report', id, null, { report, mockCheckpoint: true, statement: 'Human acknowledged this synthetic report; not a real identity verification or approval.' });
      return tx.record.findUniqueOrThrow({ where: { id }, include });
    });
  }
  async removeComparable(userId: string, id: string, cid: string, body: unknown) {
    return this.transaction(async tx => {
      await this.existing(tx, id);
      const before = await tx.comparableListing.findFirst({ where: { id: cid, recordId: id } });
      if (!before) throw new NotFoundException('Comparable not found');
      await this.bump(tx, id, version(asObject(body)));
      await tx.comparableListing.delete({ where: { id: cid } });
      await this.event(tx, userId, id, 'delete', 'comparable', cid, before, null);
      return tx.record.findUniqueOrThrow({ where: { id }, include });
    });
  }
  async import(userId: string, body: unknown) {
    const b = asObject(body);
    if (!Array.isArray(b.records) || !b.records.length || b.records.length > 500) throw new BadRequestException('Import 1–500 synthetic records per file');
    const comparableMap = b.comparablesByRecord ? asObject(b.comparablesByRecord) : {};
    const parsed = b.records.map(raw => {
      const row = asObject(raw);
      const recordId = text(row.id, 'id');
      if (!/^SYN-ET-[A-Za-z0-9-]+$/.test(recordId)) throw new BadRequestException('Synthetic record ID required');
      const listings = comparableMap[recordId] ?? [];
      if (!Array.isArray(listings) || listings.length > 5) throw new BadRequestException('Maximum five comparables per imported record');
      return { recordId, data: parseRecord(row, true), listings: listings.map(parseComparable),
        status: row.reviewStatus === undefined ? 'pending' as const : reviewStatus(row.reviewStatus),
        note: text(row.reviewNote, 'reviewNote', true), summary: text(row.publicReviewSummary, 'publicReviewSummary', true),
        legacyDate: text(row.reviewDate, 'reviewDate', true) };
    });
    return this.transaction(async tx => {
      const imported: string[] = [], skipped: string[] = [];
      for (const row of parsed) {
        if (await tx.record.findUnique({ where: { recordId: row.recordId }, select: { id: true } })) { skipped.push(row.recordId); continue; }
        const record = await tx.record.create({ data: { ...row.data, recordId: row.recordId, createdBy: userId,
          signals: this.signals(row.data.value, row.data.daysOpen), reviewStatus: row.status, reviewNote: row.note, publicReviewSummary: row.summary,
          // Historical assessments are imported data, not a new authenticated sign-off.
          reviewDate: row.legacyDate || null, reviewedBy: null,
          comparables: { create: row.listings },
        }, include });
        await this.event(tx, userId, record.id, 'import', 'record', record.id, null, { ...record, provenance: 'browser/file snapshot; historical assessment is unverified' });
        imported.push(row.recordId);
      }
      return { imported, skipped, message: 'Existing records and their comparables were left unchanged. Original browser/file data remains available.' };
    });
  }
}
