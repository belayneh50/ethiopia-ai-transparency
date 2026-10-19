import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DEMO_ACCOUNTS } from '../../../packages/shared-types';

// Boots the real AppModule (same controllers/guards/pipes as production) on an
// ephemeral port against the dedicated test database provisioned by jest
// global-setup. No manually-started servers are involved.
describe('Auth & RBAC contract (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;

  type TokenSet = { token: string; role: string };

  const tokens: Record<string, TokenSet> = {};

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1'); // mirror apps/api/src/main.ts
    await app.init();
    await app.listen(0);
    const address = app.getHttpServer().address() as { port: number };
    baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

    for (const account of DEMO_ACCOUNTS) {
      const res = await api('/auth/login', { body: { email: account.username, password: account.password } });
      if (res.status === 201) {
        tokens[account.role] = { token: res.json.accessToken as string, role: res.json.user.role as string };
      }
    }
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  async function api(
    path: string,
    opts: { method?: string; token?: string; body?: unknown } = {},
  ): Promise<{ status: number; json: any }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
    const method = opts.method || (opts.body !== undefined ? 'POST' : 'GET');
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }
    return { status: res.status, json };
  }

  describe('login', () => {
    it.each(DEMO_ACCOUNTS.map((a) => [a.username, a.password, a.name, a.role]))(
      '201 with correct user for %s',
      async (email, password, name, role) => {
        const res = await api('/auth/login', { body: { email, password } });
        expect(res.status).toBe(201);
        expect(res.json.user.email).toBe(email);
        expect(res.json.user.name).toBe(name);
        expect(res.json.user.role).toBe(role);
        expect(typeof res.json.accessToken).toBe('string');
      },
    );

    it('401 on wrong password', async () => {
      const res = await api('/auth/login', { body: { email: 'admin.demo', password: 'wrong' } });
      expect(res.status).toBe(401);
    });

    it('401 on unknown user', async () => {
      const res = await api('/auth/login', { body: { email: 'ghost.demo', password: 'Adm1n!2026$ecure' } });
      expect(res.status).toBe(401);
    });
  });

  describe('anonymous access is rejected everywhere gated', () => {
    it.each(['/records', '/records/missing', '/auth/users', '/audit', '/reviews/record/missing'])(
      '401 on GET %s without a token',
      async (path) => {
        const res = await api(path);
        expect(res.status).toBe(401);
      },
    );

    it('401 on POST /records/:id/review without a token', async () => {
      const res = await api('/records/missing/review', { method: 'POST', body: {} });
      expect(res.status).toBe(401);
    });
  });

  describe('register', () => {
    const fresh = { email: 'e2e-register.demo', password: 'E2eSecret!2026', name: 'E2E Register' };

    it('201 and always assigns least-privilege role, ignoring any body role', async () => {
      const res = await api('/auth/register', { body: { ...fresh, role: 'admin' } });
      expect(res.status).toBe(201);
      // register returns the created user directly (no { accessToken, user } wrapper)
      expect(res.json.role).toBe('public');
      expect(res.json.email).toBe(fresh.email);
    });

    it('new least-privilege account can view records but is 403 on user management', async () => {
      const login = await api('/auth/login', { body: { email: fresh.email, password: fresh.password } });
      expect(login.status).toBe(201);
      const token = login.json.accessToken as string;
      expect((await api('/records', { token })).status).toBe(200);
      expect((await api('/auth/users', { token })).status).toBe(403);
      expect((await api('/audit', { token })).status).toBe(403);
    });

    it('400 on junk/invalid bodies (never 500)', async () => {
      for (const body of [
        {},
        { email: fresh.email }, // missing name + password
        { email: fresh.email, name: 'x', password: 'short' }, // password too short
        { email: '   ', name: 'x', password: 'E2eSecret!2026' }, // whitespace email
        { email: 123, name: 'x', password: 'E2eSecret!2026' }, // non-string email
      ]) {
        const res = await api('/auth/register', { body });
        expect(res.status).toBe(400);
      }
    });

    it('409 on duplicate email', async () => {
      const res = await api('/auth/register', { body: { email: fresh.email, password: fresh.password, name: fresh.name } });
      expect(res.status).toBe(409);
    });
  });

  describe('role gates (allowed roles reach the handler; denied roles get 403)', () => {
    // A missing record id makes allowed roles fall through to the handler (404);
    // denied roles are stopped by RolesGuard (403).
    const R = { method: 'POST', body: {} };

    it('admin: user management and audit 200, review/comparable/guidance gates pass', async () => {
      const t = tokens.admin.token;
      expect((await api('/auth/users', { token: t })).status).toBe(200);
      expect((await api('/audit', { token: t })).status).toBe(200);
      expect((await api('/records/missing/review', { token: t, ...R })).status).toBe(404);
      expect((await api('/records/missing/comparables', { token: t, ...R })).status).toBe(404);
      expect((await api('/reviews/record/missing/guidance', { token: t, ...R })).status).toBe(404);
      expect((await api('/settings/thresholds', { token: t })).status).toBe(200);
    });

    it('viewer: read-only — records 200, everything sensitive 403', async () => {
      const t = tokens.public.token;
      expect((await api('/records', { token: t })).status).toBe(200);
      expect((await api('/auth/users', { token: t })).status).toBe(403);
      expect((await api('/audit', { token: t })).status).toBe(403);
      expect((await api('/records/missing/review', { token: t, ...R })).status).toBe(403);
      expect((await api('/reviews/record/missing/guidance', { token: t, ...R })).status).toBe(403);
      expect((await api('/settings/thresholds', { token: t })).status).toBe(200);
      expect((await api('/settings/thresholds', { token: t, method: 'PATCH', body: { price: 1, repeatSupplier: 2, delay: 1 } })).status).toBe(403);
    });

    it('only Admin updates shared thresholds and creates an audit event', async () => {
      const body = { price: 1_750_000, repeatSupplier: 3, delay: 45 };
      const changed = await api('/settings/thresholds', { token: tokens.admin.token, method: 'PATCH', body });
      expect(changed.status).toBe(200);
      expect(changed.json).toMatchObject(body);
      const read = await api('/settings/thresholds', { token: tokens.reviewer.token });
      expect(read.json).toMatchObject(body);
      const audit = await api('/audit?action=update', { token: tokens.admin.token });
      expect(audit.json.data.some((event: any) => event.entityType === 'threshold_settings' && event.entityId === 'global')).toBe(true);
    });

    it('admin and recorder (governor) create records with 201 and the created record; viewer and reviewer get 403', async () => {
      const body = {
        item: 'E2E laptop computers',
        itemAm: '',
        category: 'Technology',
        categoryAm: '',
        buyer: 'E2E Sample Buyer',
        supplier: 'E2E Sample Supplier',
        value: 120000,
        bids: 3,
        status: 'Paid',
        statusAm: '',
        approvalDate: '2026-09-01',
        paymentDate: '2026-09-02',
      };
      for (const role of ['admin', 'governor']) {
        const res = await api('/records', { token: tokens[role].token, method: 'POST', body });
        expect(res.status).toBe(201);
        expect(res.json.item).toBe(body.item);
        expect(res.json.buyer).toBe(body.buyer);
        expect(res.json.value).toBe(body.value);
        expect(res.json.recordId).toMatch(/^SYN-ET-/);
        expect(Array.isArray(res.json.signals)).toBe(true);
      }
      expect((await api('/records', { token: tokens.public.token, method: 'POST', body })).status).toBe(403);
      expect((await api('/records', { token: tokens.reviewer.token, method: 'POST', body })).status).toBe(403);
    });

    it('recorder (governor): may create records but is 403 on review/comparables/guidance/audit', async () => {
      const t = tokens.governor.token;
      expect((await api('/records', { token: t })).status).toBe(200);
      expect((await api('/records/missing/review', { token: t, ...R })).status).toBe(403);
      expect((await api('/records/missing/comparables', { token: t, ...R })).status).toBe(403);
      expect((await api('/reviews/record/missing/guidance', { token: t, ...R })).status).toBe(403);
      expect((await api('/audit', { token: t })).status).toBe(403);
    });

    it('reviewer: no record creation, but review/comparables/guidance gates pass', async () => {
      const t = tokens.reviewer.token;
      expect((await api('/records', { token: t })).status).toBe(200);
      expect((await api('/records/missing/review', { token: t, ...R })).status).toBe(404);
      expect((await api('/records/missing/comparables', { token: t, ...R })).status).toBe(404);
      expect((await api('/reviews/record/missing/guidance', { token: t, ...R })).status).toBe(404);
      expect((await api('/audit', { token: t })).status).toBe(200);
    });
  });
});
