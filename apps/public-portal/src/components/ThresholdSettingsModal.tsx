import { useState } from "react";
import { ModalShell } from "./ModalShell";
import { useAuth } from "../auth/AuthContext";
import { useSettings } from "../SettingsContext";

type Props = { onClose: () => void; onSave: (settings: { price: number; repeatSupplier: number; delay: number }) => Promise<void> };

export function ThresholdSettingsModal({ onClose, onSave }: Props) {
  const { can } = useAuth();
  const { settings } = useSettings();
  const [price, setPrice] = useState(String(settings.price));
  const [repeatSupplier, setRepeatSupplier] = useState(String(settings.repeatSupplier));
  const [delay, setDelay] = useState(String(settings.delay));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!can("changeThresholds")) return;
    setSaving(true); setError('');
    try {
      await onSave({ price: Number(price) || 0, repeatSupplier: Number(repeatSupplier) || 0, delay: Number(delay) || 0 });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save thresholds');
      setSaving(false);
    }
  };
  const resetDefaults = () => {
    setPrice(String(1_500_000));
    setRepeatSupplier(String(2));
    setDelay(String(30));
  };

  return (
    <ModalShell open={true} onClose={onClose} titleEn="Threshold Settings" titleAm="የገደብ ማደራጃ" ariaLabel="Threshold settings">
      <p className="text-[13px] text-success font-medium leading-relaxed mt-1">
        Adjust the demo thresholds used for signal detection. · ለማሳያ ምልክት ስሌት የሚሰሩ የማሳያ ገደቦችን ያስተካክሉ።
      </p>

      <div className="mt-5 grid gap-4">
        <label className="block">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-brand-text">Price threshold (ETB) · የዋጋ ገደብ (ብር)</span>
          <span className="block text-[10px] text-soft mb-1">Unit price comparison signal</span>
          <input type="number" min="0" step="10000" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-lg border-2 border-gold-border dark:border-line-strong bg-surface-warm dark:bg-surface-warm px-4 py-3 text-[15px] text-brand-text dark:text-main dark:text-success shadow-inner focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold-border transition" />
        </label>
        <label className="block">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-brand-text">Repeat supplier wins · ተደጋጋሚ አቅራቢ አሸናፊ</span>
          <span className="block text-[10px] text-soft mb-1">Repetition signal count</span>
          <input type="number" min="2" step="1" value={repeatSupplier} onChange={(e) => setRepeatSupplier(e.target.value)} className="w-full rounded-lg border-2 border-gold-border dark:border-line-strong bg-surface-warm dark:bg-surface-warm px-4 py-3 text-[15px] text-brand-text dark:text-main dark:text-success shadow-inner focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold-border transition" />
        </label>
        <label className="block">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-brand-text">Delay threshold (days) · የመዘግየት ገደብ (ቀናት)</span>
          <span className="block text-[10px] text-soft mb-1">Overdue approval or payment signal</span>
          <input type="number" min="1" step="1" value={delay} onChange={(e) => setDelay(e.target.value)} className="w-full rounded-lg border-2 border-gold-border dark:border-line-strong bg-surface-warm dark:bg-surface-warm px-4 py-3 text-[15px] text-brand-text dark:text-main dark:text-success shadow-inner focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold-border transition" />
        </label>
      </div>

      <div className="mt-6 flex gap-3 justify-end">
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button type="button" onClick={resetDefaults} className="rounded-lg px-5 py-2.5 text-[13px] font-bold bg-surface-alt text-soft border border-line-strong shadow-sm hover:bg-surface-warm hover:border-gold-border transition">
          Reset defaults · ነባር ይመልሱ
        </button>
        <button type="button" onClick={save} disabled={saving} className="rounded-lg px-6 py-2.5 text-[13px] font-extrabold bg-brand text-white shadow-md hover:opacity-95 transition disabled:opacity-60">
          {saving ? 'Saving… · በማስቀመጥ ላይ…' : 'Save thresholds · ገደቦችን ማሰር'}
        </button>
      </div>
    </ModalShell>
  );
}
