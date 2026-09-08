import { describe, it, expect, vi } from 'vitest';
vi.mock('./auth/AuthContext', () => ({ apiFetch: vi.fn() }));
import { importPayload } from './recordsApi';
import type { AuditSessionExport } from './types';
describe('browser import boundary', () => {
  it('keeps historical review content while excluding claimed identities and session credentials', () => {
    const session = { records: [{ id: 'SYN-ET-TEST', reviewNote: 'Synthetic note', reviewDate: '2026-09-01', reviewSignedBy: { fin: 'legacy-id' }, token: 'legacy-token' }], comparablesByRecord: {} } as unknown as AuditSessionExport;
    const result = importPayload(session);
    expect(result.records[0]).toEqual({ id: 'SYN-ET-TEST', reviewNote: 'Synthetic note', reviewDate: '2026-09-01' });
    expect(JSON.stringify(result)).not.toContain('legacy-');
    expect(session.records[0]).toHaveProperty('reviewSignedBy');
  });
});
