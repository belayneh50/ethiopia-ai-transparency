import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULTS = { price: 1_500_000, repeatSupplier: 2, delay: 30 };

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  get() {
    return this.prisma.thresholdSettings.upsert({
      where: { id: 'global' },
      create: { id: 'global', ...DEFAULTS },
      update: {},
    });
  }

  async update(actorId: string, body: unknown) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Invalid settings');
    const input = body as Record<string, unknown>;
    const price = Number(input.price), repeatSupplier = Number(input.repeatSupplier), delay = Number(input.delay);
    if (!Number.isInteger(price) || price < 0 || !Number.isInteger(repeatSupplier) || repeatSupplier < 2 || !Number.isInteger(delay) || delay < 1) {
      throw new BadRequestException('Threshold values are invalid');
    }
    return this.prisma.$transaction(async tx => {
      const before = await tx.thresholdSettings.upsert({ where: { id: 'global' }, create: { id: 'global', ...DEFAULTS }, update: {} });
      const after = await tx.thresholdSettings.update({
        where: { id: 'global' },
        data: { price, repeatSupplier, delay, updatedBy: actorId, version: { increment: 1 } },
      });
      await tx.auditLog.create({
        data: {
          action: 'update', entityType: 'threshold_settings', entityId: 'global', performedBy: actorId,
          changes: { before: { price: before.price, repeatSupplier: before.repeatSupplier, delay: before.delay }, after: { price, repeatSupplier, delay } } as Prisma.InputJsonValue,
        },
      });
      return after;
    });
  }
}
