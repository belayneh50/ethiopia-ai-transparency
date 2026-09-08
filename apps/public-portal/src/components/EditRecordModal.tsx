import { useState } from 'react';
import type { RecordItem } from '../types';
import { updateRecord } from '../recordsApi';
import { Dual } from './Dual';
export function EditRecordModal({ record, onSaved, onClose }: { record: RecordItem; onSaved: () => Promise<void>; onClose: () => void }) {
  const [data, setData] = useState({ ...record, approvalDate: record.approvalDate || new Date(record.date).toISOString().slice(0, 10), paymentDate: record.paymentDate || '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const labels = { item: ['Item (English)', 'ዕቃ (እንግሊዝኛ)'], itemAm: ['Item (Amharic)', 'ዕቃ (አማርኛ)'], buyer: ['Buyer', 'ገዢ'], supplier: ['Supplier', 'አቅራቢ'], status: ['Status (English)', 'ሁኔታ (እንግሊዝኛ)'], statusAm: ['Status (Amharic)', 'ሁኔታ (አማርኛ)'] } as const;
  return <div className="modal-overlay"><section className="modal" role="dialog" aria-modal="true" aria-label="Edit synthetic record">
    <h2><Dual en="Edit sample record" am="የሙከራ መዝገብ ያስተካክሉ" /></h2>
    <form onSubmit={async event => { event.preventDefault(); if (busy) return; setBusy(true); setError(''); try { await updateRecord(record, data); await onSaved(); onClose(); } catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); } finally { setBusy(false); } }}>
      <div className="form-grid">
        {(Object.keys(labels) as Array<keyof typeof labels>).map(key => <label key={key}><Dual en={labels[key][0]} am={labels[key][1]} /><input required value={data[key]} onChange={e => setData({ ...data, [key]: e.target.value })} /></label>)}
        <label><Dual en="Value (ETB)" am="ዋጋ (ብር)" /><input required type="number" min="0" value={data.value} onChange={e => setData({ ...data, value: Number(e.target.value) })} /></label>
        <label><Dual en="Bids" am="ጨረታዎች" /><input required type="number" min="0" value={data.bids} onChange={e => setData({ ...data, bids: Number(e.target.value) })} /></label>
        <label><Dual en="Approval date" am="የማጽደቅ ቀን" /><input required type="date" value={data.approvalDate} onChange={e => setData({ ...data, approvalDate: e.target.value, date: e.target.value })} /></label>
        <label><Dual en="Payment date" am="የክፍያ ቀን" /><input type="date" value={data.paymentDate} onChange={e => setData({ ...data, paymentDate: e.target.value })} /></label>
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={busy}><Dual en="Save to database" am="በዳታቤዝ አስቀምጥ" /></button>
      <button type="button" onClick={onClose}><Dual en="Cancel" am="ሰርዝ" /></button>
    </form>
  </section></div>;
}
