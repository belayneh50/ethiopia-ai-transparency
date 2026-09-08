import { useEffect, useState } from 'react';
import { request } from '../recordsApi';
import { Dual } from './Dual';
type Event = { id: string; action: string; entityType: string; actorName: string; performedBy: string | null; createdAt: string; changes: unknown };
const PAGE_SIZE = 2;

export function AuditHistory({ recordId, revision }: { recordId: string; revision?: number }) {
  const [data, setData] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => { setPage(1); }, [recordId, revision]);
  useEffect(() => {
    let active = true;
    setData([]); setError('');
    request<{ data: Event[]; meta: { total: number; totalPages: number } }>(`/api/audit?recordId=${encodeURIComponent(recordId)}&page=${page}&limit=${PAGE_SIZE}`)
      .then(result => { if (active) { setData(result.data); setTotal(result.meta.total); setPages(Math.max(1, result.meta.totalPages)); } })
      .catch(() => { if (active) setError('Audit history unavailable. · የለውጥ ታሪክ አይገኝም።'); });
    return () => { active = false; };
  }, [recordId, revision, page]);
  return <section className="audit-history">
    <h3><Dual en="Saved change history" am="የተቀመጠ የለውጥ ታሪክ" /></h3>
    <p><Dual en="Actor and time come from the server. This local database is not immutable evidence." am="ተጠቃሚው እና ጊዜው ከአገልጋዩ ይመጣሉ። ይህ የአካባቢ ዳታቤዝ የማይቀየር ማስረጃ አይደለም።" /></p>
    {error && <p role="alert">{error}</p>}
    {data.map(event => <details key={event.id}>
      <summary>{event.action} · {event.entityType} · {event.actorName} · {new Date(event.createdAt).toLocaleString()}</summary>
      <pre>{JSON.stringify(event.changes, null, 2)}</pre>
    </details>)}
    {!error && !data.length && <p><Dual en="No saved events on this page." am="በዚህ ገጽ የተቀመጠ ለውጥ የለም።" /></p>}
    <div className="audit-history-pagination" aria-label="Audit history pagination">
      <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><Dual en="Previous" am="ቀዳሚ" /></button>
      <span aria-live="polite">Page {page} of {pages} · {total} saved {total === 1 ? "event" : "events"}</span>
      <button type="button" disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}><Dual en="Next" am="ቀጣይ" /></button>
    </div>
  </section>;
}
