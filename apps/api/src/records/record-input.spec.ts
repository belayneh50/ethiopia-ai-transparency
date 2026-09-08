import { parseRecord, parseComparable, reviewStatus } from './record-input';
const record = { item: 'Demo', itemAm: 'ማሳያ', category: 'Demo', categoryAm: 'ማሳያ', buyer: 'Sample buyer', supplier: 'Sample supplier', value: 100, bids: 3, status: 'Paid', statusAm: 'ተከፍሏል', approvalDate: '2026-09-01', paymentDate: '2026-09-03' };
describe('record input', () => {
  it('uses payment date for completed duration and ignores caller actor/version fields', () => {
    expect(parseRecord({ ...record, createdBy: 'spoof', reviewedBy: 'spoof', version: 99 })).toMatchObject({ daysOpen: 2 });
    expect(parseRecord(record)).not.toHaveProperty('createdBy');
  });
  it('rejects backwards dates, invalid values and unsupported statuses', () => {
    expect(() => parseRecord({ ...record, paymentDate: '2026-08-31' })).toThrow();
    expect(() => parseRecord({ ...record, value: '100' })).toThrow();
    expect(() => reviewStatus('approved')).toThrow();
  });
  it('keeps explicitly imported historic duration and validates comparable URLs', () => {
    expect(parseRecord({ ...record, daysOpen: 9 }, true).daysOpen).toBe(9);
    expect(() => parseComparable({ item: 'Sample', condition: 'New', price: 10, sourceUrl: 'javascript:alert(1)', observationDate: '2026-09-01' })).toThrow();
  });
});
