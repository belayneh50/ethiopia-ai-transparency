import 'reflect-metadata';
import { ExecutionContext, INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
describe('AI endpoint role enforcement', () => {
  let app: INestApplication;
  let base: string;
  const ai = { audit: jest.fn().mockResolvedValue({ source: 'fallback' }), guidance: jest.fn().mockResolvedValue({ source: 'fallback' }) };
  beforeAll(async () => {
    const module = await Test.createTestingModule({ controllers: [AiController], providers: [{ provide: AiService, useValue: ai }] })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest<{ headers: Record<string, string>; user?: { role: string } }>();
        if (!req.headers.authorization) throw new UnauthorizedException();
        req.user = { role: req.headers.authorization }; return true;
      } }).compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
  });
  afterAll(async () => { await app?.close(); });
  it.each(['audit', 'guidance'])('denies anonymous and non-review roles for %s', async endpoint => {
    for (const role of ['', 'public', 'governor']) {
      const response = await fetch(`${base}/ai/${endpoint}`, { method: 'POST', headers: role ? { Authorization: role } : {} });
      expect(response.status).toBe(role ? 403 : 401);
    }
  });
  it.each(['admin', 'reviewer'])('allows %s for both AI paths', async role => {
    for (const endpoint of ['audit', 'guidance']) expect((await fetch(`${base}/ai/${endpoint}`, { method: 'POST', headers: { Authorization: role } })).status).toBe(201);
  });
});
