import { apiFetch } from './auth/AuthContext';
import { createFallbackGuidance, type GeminiReviewInput, type GeminiReviewGuidance } from '@ethiopia-ai/shared-types/guidance';
import { adaptGeminiPayload } from '@ethiopia-ai/shared-types/guidance-adapter';
export * from '@ethiopia-ai/shared-types/guidance';
export async function requestGeminiGuidance(input: GeminiReviewInput): Promise<GeminiReviewGuidance> {
  try {
    const response = await apiFetch('/api/ai/guidance', { method: 'POST', body: JSON.stringify(input), signal: AbortSignal.timeout(65_000) });
    if (response.status === 401 || response.status === 403) throw new Error('access_denied');
    if (!response.ok) return createFallbackGuidance(input.language);
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object') return createFallbackGuidance(input.language);
    const value = data as Record<string, unknown>;
    if (value.source === 'fallback') return createFallbackGuidance(input.language);
    return { ...adaptGeminiPayload({ candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }] }, input.language), source: 'gemini' };
  } catch (error) {
    if (error instanceof Error && error.message === 'access_denied') throw error;
    return createFallbackGuidance(input.language);
  }
}
