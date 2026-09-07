import { apiFetch } from '../auth/AuthContext';
import { adaptTransparencyAuditText, createTransparencyAuditFallback, type TransparencyAuditInput, type TransparencyAuditResult } from '@ethiopia-ai/shared-types/transparency';
export * from '@ethiopia-ai/shared-types/transparency';

export async function requestTransparencyAudit(input: TransparencyAuditInput): Promise<TransparencyAuditResult> {
  try {
    const response = await apiFetch('/api/ai/audit', { method: 'POST', body: JSON.stringify(input), signal: AbortSignal.timeout(65_000) });
    if (response.status === 401 || response.status === 403) throw new Error('access_denied');
    if (!response.ok) return { ...createTransparencyAuditFallback(input), fallbackReason: 'upstream' };
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object') throw new Error('response_contract');
    const value = data as Record<string, unknown>;
    if (value.source !== 'gemini' && value.source !== 'fallback') throw new Error('response_contract');
    return { ...adaptTransparencyAuditText(JSON.stringify(value), input.language), source: value.source,
      ...(value.source === 'fallback' ? { fallbackReason: 'upstream' as const } : {}) };
  } catch (error) {
    if (error instanceof Error && error.message === 'access_denied') throw error;
    return { ...createTransparencyAuditFallback(input), fallbackReason: 'network' };
  }
}
