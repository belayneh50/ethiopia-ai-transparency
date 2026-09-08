import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { DEMO_ACCOUNTS } from '../../../packages/shared-types';

// Uses only the dedicated test database created by global-setup, never the dev DB.
describe('shared records and atomic audit history', () => {
  let app: INestApplication;
  let db: PrismaService;
  let base: string;
  const tokens: Record<string, string> = {};
  const draft = { item: 'Synthetic shared item', itemAm: 'ሰው ሰራሽ ዕቃ', category: 'Demo', categoryAm: 'ማሳያ', buyer: 'Synthetic buyer', supplier: 'Synthetic supplier', value: 100, quantity: 2, unit: 'units', bids: 3, status: 'Paid', statusAm: 'ተከፍሏል', approvalDate: '2026-09-01', paymentDate: '2026-09-03' };
  async function api(path: string, role: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') {
    const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens[role]}` }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: res.status, body: await res.json() };
  }
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication(); db = module.get(PrismaService);
    app.setGlobalPrefix('api/v1'); await app.listen(0, '127.0.0.1'); base = `${await app.getUrl()}/api/v1`;
    for (const account of DEMO_ACCOUNTS) {
      const res = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: account.username, password: account.password }) });
      tokens[account.role] = (await res.json()).accessToken;
    }
  }, 60000);
  afterAll(async () => { await app?.close(); });

  it('shares a recorder-created record, persists reviewer changes, rejects spoofing and stale writes', async () => {
    const created = await api('/records', 'governor', { ...draft, createdBy: 'spoof' });
    expect(created.status).toBe(201);
    const row = created.body;
    expect(row.daysOpen).toBe(2);
    expect(row.createdBy).not.toBe('spoof');
    expect((await api('/records/' + row.id, 'reviewer')).body.item).toBe(draft.item);
    const review = await api(`/records/${row.id}/review`, 'reviewer', { version: row.version, reviewStatus: 'under-review', reviewNote: 'Synthetic internal note', reviewedBy: 'spoof' });
    expect(review.status).toBe(201);
    expect(review.body.reviewedBy).not.toBe('spoof');
    expect((await api('/records/' + row.id, 'admin')).body.reviewNote).toBe('Synthetic internal note');
    expect((await api('/records/' + row.id, 'public')).body.reviewNote).toBeNull();
    expect((await api(`/records/${row.id}/review`, 'admin', { version: row.version, reviewStatus: 'referred' })).status).toBe(409);
    expect((await api(`/records/${row.id}/review`, 'governor', { version: review.body.version, reviewStatus: 'referred' })).status).toBe(403);
    const events = await api(`/audit?recordId=${row.id}`, 'reviewer');
    expect(events.body.data.map((e: { action: string }) => e.action)).toEqual(['review', 'create']);
    expect(events.body.data[0].changes.before.reviewStatus).toBe('pending');
    expect(events.body.data[0].changes.after.reviewStatus).toBe('underReview');
    expect(events.body.data[0].performedBy).toBe(review.body.reviewedBy);
  });

  it('enforces recorder ownership, comparable permissions, and records comparable deletion', async () => {
    const owned = (await api('/records', 'governor', draft)).body;
    expect((await api(`/records/${owned.id}`, 'governor', { ...draft, value: 200, version: owned.version }, 'PATCH')).status).toBe(200);
    const adminRecord = (await api('/records', 'admin', draft)).body;
    expect((await api(`/records/${adminRecord.id}`, 'governor', { ...draft, version: adminRecord.version }, 'PATCH')).status).toBe(403);
    const listing = { item: 'Sample comparison', condition: 'New', price: 50, sourceUrl: '', observationDate: '2026-09-01', note: 'Synthetic', version: adminRecord.version };
    expect((await api(`/records/${adminRecord.id}/comparables`, 'public', listing)).status).toBe(403);
    const added = await api(`/records/${adminRecord.id}/comparables`, 'reviewer', listing);
    expect(added.status).toBe(201);
    const cid = added.body.comparables[0].id;
    const removed = await api(`/records/${adminRecord.id}/comparables/${cid}`, 'reviewer', { version: added.body.version }, 'DELETE');
    expect(removed.body.comparables).toHaveLength(0);
    const events = (await api(`/audit?recordId=${adminRecord.id}`, 'admin')).body.data;
    expect(events[0].changes.before.id).toBe(cid);
    expect(events[0].changes.after).toBeNull();
  });

  it('imports a snapshot without overwriting duplicate IDs or existing notes', async () => {
    const snapshot = { records: [{ ...draft, id: 'SYN-ET-IMPORT-TEST', date: '2026-09-01', daysOpen: 2, reviewStatus: 'under-review', reviewNote: 'Legacy synthetic note' }], comparablesByRecord: {} };
    expect((await api('/records/import', 'governor', snapshot)).status).toBe(403);
    expect((await api('/records/import', 'admin', snapshot)).body.imported).toEqual(['SYN-ET-IMPORT-TEST']);
    snapshot.records[0].reviewNote = 'Must not overwrite';
    expect((await api('/records/import', 'admin', snapshot)).body.skipped).toEqual(['SYN-ET-IMPORT-TEST']);
    const saved = await db.record.findUniqueOrThrow({ where: { recordId: 'SYN-ET-IMPORT-TEST' } });
    expect(saved.reviewNote).toBe('Legacy synthetic note');
    expect(saved.reviewedBy).toBeNull();
  });

  it('rolls back a record change when its audit event cannot be written', async () => {
    const row = (await api('/records', 'admin', draft)).body;
    const original = db.$transaction.bind(db);
    const spy = jest.spyOn(db, '$transaction');
    // Inject failure inside the REAL database transaction, after the update.
    spy.mockImplementationOnce(((work: (tx: unknown) => Promise<unknown>, options: unknown) => original(async tx => work(new Proxy(tx, {
      get(target, key) { if (key === 'auditLog') return { create: async () => { throw new Error('Injected audit failure'); } }; return Reflect.get(target, key); },
    })), options as never)) as typeof db.$transaction);
    const response = await api(`/records/${row.id}/review`, 'reviewer', { version: row.version, reviewStatus: 'referred', reviewNote: 'Must roll back' });
    spy.mockRestore();
    expect(response.status).toBe(500);
    const saved = await db.record.findUniqueOrThrow({ where: { id: row.id } });
    expect(saved.version).toBe(row.version);
    expect(saved.reviewStatus).toBe('pending');
    expect(await db.auditLog.count({ where: { recordId: row.id } })).toBe(1);
  });
});
