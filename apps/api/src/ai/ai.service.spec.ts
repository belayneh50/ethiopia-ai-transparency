import { ConfigService } from '@nestjs/config';
import { AiService, parseAuditInput } from './ai.service';

const input = { language: 'both', id: 'SYN-ET-TEST', item: 'Sample', category: 'Sample', buyer: 'Sample buyer', supplier: 'Sample supplier', value: 100, date: '2026-09-01', status: 'open', daysOpen: 5, bids: 3, signals: [] };
const valid = { transparencyScore: 70, identifiedBottlenecksEn: ['Check documents.'], identifiedBottlenecksAm: ['ሰነዶችን ያረጋግጡ።'], recommendationsEn: ['Review context.'], recommendationsAm: ['ዐውዱን ያረጋግጡ።'] };
describe('authenticated AI service contract', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });
  it('rejects non-synthetic and malformed inputs and strips identity fields', () => {
    expect(() => parseAuditInput({ ...input, id: 'REAL-1' })).toThrow();
    expect(() => parseAuditInput({ ...input, bids: '3' })).toThrow();
    expect(parseAuditInput({ ...input, fin: 'do-not-forward', notes: 'private' })).toEqual(input);
  });
  it('returns bilingual offline output without making a request when unconfigured', async () => {
    global.fetch = jest.fn();
    const result = await new AiService(new ConfigService({})).audit(input);
    expect(result).toMatchObject({ source: 'fallback', fallbackReason: 'unconfigured' });
    expect(result.recommendationsAm.length).toBeGreaterThan(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it('sends structured output configuration and accepts a validated response', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(valid) }] } }] })));
    const result = await new AiService(new ConfigService({ GEMINI_API_KEY: 'test-only' })).audit(input);
    expect(result).toMatchObject({ source: 'gemini', transparencyScore: 70 });
    const options = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(options.body)).generationConfig.responseSchema.required).toContain('transparencyScore');
    expect(JSON.stringify(result)).not.toContain('test-only');
  });
  it.each([429, 503])('falls back on upstream status %s', async status => {
    global.fetch = jest.fn().mockResolvedValue(new Response('', { status }));
    expect(await new AiService(new ConfigService({ GEMINI_API_KEY: 'test-only' })).audit(input)).toMatchObject({ source: 'fallback', fallbackReason: status === 429 ? 'quota' : 'upstream' });
  });
  it('falls back on malformed model output', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({ candidates: 'invalid' })));
    expect(await new AiService(new ConfigService({ GEMINI_API_KEY: 'test-only' })).audit(input)).toMatchObject({ source: 'fallback', fallbackReason: 'response_contract' });
  });
});
