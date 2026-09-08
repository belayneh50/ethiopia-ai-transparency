// One real provider request at most. Uses existing backend configuration only.
// No key is loaded, printed, changed or copied by this script.
const { DEMO_ACCOUNTS } = require('../packages/shared-types/dist/index.js');
const base = process.env.SMOKE_API_URL || 'http://127.0.0.1:3001/api/v1';
async function main() {
  const account = DEMO_ACCOUNTS.find(a => a.role === 'admin');
  const login = await fetch(`${base}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: account.username, password: account.password }), signal: AbortSignal.timeout(10000),
  });
  if (!login.ok) throw new Error(`Demo login failed (HTTP ${login.status}); no Gemini request was made. Existing demo account credentials may have been changed.`);
  const { accessToken } = await login.json();
  if (typeof accessToken !== 'string') throw new Error('Invalid login response; no Gemini request was made.');
  const response = await fetch(`${base}/ai/audit`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ language: 'both', id: 'SYN-ET-SMOKE', item: 'Synthetic sample items', category: 'Demo', buyer: 'Sample buyer', supplier: 'Sample supplier', value: 100, date: '2026-09-01', status: 'Open', daysOpen: 3, bids: 3, signals: [] }),
    signal: AbortSignal.timeout(65000),
  });
  if (!response.ok) throw new Error(`Authenticated AI endpoint returned HTTP ${response.status}.`);
  const result = await response.json();
  if (result.source !== 'gemini') {
    const reason = ['unconfigured', 'network', 'quota', 'upstream', 'response_contract'].includes(result.fallbackReason) ? result.fallbackReason : 'unspecified';
    throw new Error(`Fallback received (${reason}); live Gemini is NOT verified.`);
  }
  if (!Number.isFinite(result.transparencyScore) || !result.recommendationsEn?.length || !result.recommendationsAm?.length) throw new Error('Live response failed the bilingual contract.');
  console.log('Live Gemini verified through the authenticated local API: source=gemini, bilingual structured response. No database record was created.');
}
main().catch(error => {
  // Only our fixed diagnostics or a generic network error; never dump upstream data/tokens.
  console.error(error.name === 'TimeoutError' ? 'Local API check timed out; live Gemini is not verified.' : error.message === 'fetch failed' ? 'Local API is unreachable; live Gemini is not verified.' : error.message);
  process.exitCode = 1;
});
