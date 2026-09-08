import { BadRequestException } from '@nestjs/common';

export function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('Expected an object');
  return value as Record<string, unknown>;
}
export function text(value: unknown, name: string, optional = false): string {
  if (optional && (value === undefined || value === null)) return '';
  if (typeof value !== 'string' || value.length > 4000 || (!optional && !value.trim())) throw new BadRequestException(`Invalid ${name}`);
  return value.trim();
}
export function number(value: unknown, name: string, integer = true): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 2_147_483_647 || (integer && !Number.isInteger(value))) throw new BadRequestException(`Invalid ${name}`);
  return value;
}
export function version(body: Record<string, unknown>): number {
  const result = number(body.version, 'version');
  if (result < 1) throw new BadRequestException('Version required');
  return result;
}
export const reviewStatuses = { pending: 'pending', 'needs-docs': 'needsDocs', 'under-review': 'underReview', 'no-concern': 'noConcern', referred: 'referred' } as const;
export function reviewStatus(value: unknown) {
  if (typeof value !== 'string' || !Object.prototype.hasOwnProperty.call(reviewStatuses, value)) throw new BadRequestException('Invalid review status');
  return reviewStatuses[value as keyof typeof reviewStatuses];
}
export function parseRecord(body: unknown, imported = false) {
  const b = asObject(body);
  const date = text(b.date ?? b.approvalDate, 'date');
  if (!Number.isFinite(Date.parse(date))) throw new BadRequestException('Invalid date');
  const approvalDate = text(b.approvalDate, 'approvalDate', true) || null;
  const paymentDate = text(b.paymentDate, 'paymentDate', true) || null;
  for (const d of [approvalDate, paymentDate]) if (d && !Number.isFinite(Date.parse(d))) throw new BadRequestException('Invalid date');
  if (approvalDate && paymentDate && Date.parse(paymentDate) < Date.parse(approvalDate)) throw new BadRequestException('Payment precedes approval');
  const daysOpen = imported ? number(b.daysOpen, 'daysOpen') : Math.max(0, Math.floor(((paymentDate ? Date.parse(paymentDate) : Date.now()) - Date.parse(approvalDate || date)) / 86_400_000));
  const quantity = b.quantity === undefined || b.quantity === null ? null : number(b.quantity, 'quantity', false);
  if (quantity !== null && quantity <= 0) throw new BadRequestException('Quantity must be positive');
  return { item: text(b.item, 'item'), itemAm: text(b.itemAm, 'itemAm', true) || text(b.item, 'item'), category: text(b.category, 'category'), categoryAm: text(b.categoryAm, 'categoryAm', true) || text(b.category, 'category'),
    buyer: text(b.buyer, 'buyer'), supplier: text(b.supplier, 'supplier'), value: number(b.value, 'value'), bids: number(b.bids, 'bids'),
    date, approvalDate, paymentDate, daysOpen, quantity, unit: text(b.unit, 'unit', true) || null,
    status: text(b.status, 'status'), statusAm: text(b.statusAm, 'statusAm', true) || text(b.status, 'status') };
}
export function parseComparable(body: unknown) {
  const b = asObject(body);
  const sourceUrl = text(b.sourceUrl, 'sourceUrl', true);
  if (sourceUrl) { try { if (!['http:', 'https:'].includes(new URL(sourceUrl).protocol)) throw new Error(); } catch { throw new BadRequestException('Use an HTTP(S) source URL'); } }
  const observationDate = text(b.observationDate, 'observationDate');
  if (!Number.isFinite(Date.parse(observationDate))) throw new BadRequestException('Invalid observation date');
  return { item: text(b.item, 'item'), itemAm: text(b.itemAm, 'itemAm', true), condition: text(b.condition, 'condition'), conditionAm: text(b.conditionAm, 'conditionAm', true),
    price: number(b.price, 'price'), sourceUrl, observationDate, note: text(b.note, 'note', true), noteAm: text(b.noteAm, 'noteAm', true) };
}
