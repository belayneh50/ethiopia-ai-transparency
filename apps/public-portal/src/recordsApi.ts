import { apiFetch } from './auth/AuthContext';
import type { ComparableListing } from './marketReference';
import type { RecordItem, AddRecordData, AuditSessionExport } from './types';
import type { ReviewStatus } from './reviewFilter';

type ServerRecord = Omit<RecordItem, 'id' | 'reviewStatus' | 'reviewNote' | 'reviewDate'> & {
  id: string; recordId: string; version: number; comparables: ComparableListing[];
  reviewStatus: string | null; reviewNote: string | null; reviewDate: string | null;
};
const statusMap: Record<string, ReviewStatus> = { needsDocs: 'needs-docs', underReview: 'under-review', noConcern: 'no-concern', pending: 'pending', referred: 'referred' };

export async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await apiFetch(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  if (!response.ok) {
    throw new Error(response.status === 409 ? 'The record changed. Refresh and retry. · መዝገቡ ተቀይሯል። ያድሱና እንደገና ይሞክሩ።'
      : response.status === 401 ? 'Please sign in again. · እንደገና ይግቡ።'
      : response.status === 403 ? 'Your role cannot perform this action. · ይህን እርምጃ ለመፈጸም ፈቃድ የለዎትም።'
      : response.status === 400 ? 'Check the fields and use a valid synthetic session file. · መስኮቹን እና የማሳያ ፋይሉን ያረጋግጡ።'
      : 'The API is unavailable; no change was confirmed. · API አይገኝም፤ ለውጡ አልተረጋገጠም።');
  }
  return response.json() as Promise<T>;
}
export function mapRecord(row: ServerRecord): RecordItem {
  return { ...row, id: row.recordId, databaseId: row.id, reviewStatus: statusMap[row.reviewStatus ?? 'pending'],
    quantity: row.quantity ?? undefined, unit: row.unit ?? undefined,
    reviewNote: row.reviewNote ?? undefined, reviewDate: row.reviewDate ?? undefined };
}
export async function loadRecords(expectedToken?: string | null) {
  const rows: ServerRecord[] = [];
  for (let page = 1; ; page++) {
    if (expectedToken !== undefined && window.sessionStorage.getItem('ethiopia_ai_token_v1') !== expectedToken) throw new Error('Session changed');
    const result = await request<{ data: ServerRecord[]; meta: { totalPages: number } }>(`/api/records?page=${page}&limit=100`);
    rows.push(...result.data);
    if (page >= result.meta.totalPages) break;
  }
  return { records: rows.map(mapRecord), comparables: Object.fromEntries(rows.map(row => [row.recordId, row.comparables])) };
}
const path = (record: RecordItem) => {
  if (!record.databaseId) throw new Error('Refresh records first.');
  return `/api/records/${encodeURIComponent(record.databaseId)}`;
};
export const createRecord = (data: AddRecordData) => request<ServerRecord>('/api/records', 'POST', data);
export const updateRecord = (record: RecordItem, data: unknown) => request<ServerRecord>(path(record), 'PATCH', data);
export const saveReview = (record: RecordItem, reviewStatus: ReviewStatus, reviewNote: string) => request<ServerRecord>(`${path(record)}/review`, 'POST', { version: record.version, reviewStatus, reviewNote });
export const addComparable = (record: RecordItem, listing: ComparableListing) => request<ServerRecord>(`${path(record)}/comparables`, 'POST', { ...listing, version: record.version });
export const removeComparable = (record: RecordItem, id: string) => request<ServerRecord>(`${path(record)}/comparables/${encodeURIComponent(id)}`, 'DELETE', { version: record.version });
/** Do not transmit legacy identity stamps, tokens, or extra snapshot fields. */
export function importPayload(session: Pick<AuditSessionExport, 'records' | 'comparablesByRecord'>) {
  const pick = (value: unknown, keys: string[]) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid snapshot row');
    const row = value as Record<string, unknown>;
    return Object.fromEntries(keys.filter(key => row[key] !== undefined).map(key => [key, row[key]]));
  };
  const records = session.records.map(row => pick(row, ['id', 'item', 'itemAm', 'category', 'categoryAm', 'buyer', 'supplier', 'value', 'quantity', 'unit', 'date', 'approvalDate', 'paymentDate', 'status', 'statusAm', 'daysOpen', 'bids', 'reviewStatus', 'reviewNote', 'reviewDate', 'publicReviewSummary']));
  const comparablesByRecord = Object.fromEntries(Object.entries(session.comparablesByRecord ?? {}).map(([id, rows]) => [id, rows.map(row => pick(row, ['item', 'itemAm', 'condition', 'conditionAm', 'price', 'sourceUrl', 'observationDate', 'note', 'noteAm']))]));
  return { records, comparablesByRecord };
}
export const importRecords = (session: Pick<AuditSessionExport, 'records' | 'comparablesByRecord'>) => request<{ imported: string[]; skipped: string[] }>('/api/records/import', 'POST', importPayload(session));
