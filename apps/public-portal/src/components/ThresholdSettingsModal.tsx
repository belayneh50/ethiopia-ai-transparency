import { useState } from "react";
import { ModalShell } from "./ModalShell";
import { useAuth } from "../auth/AuthContext";
import { isCurrentVerification } from "../faydaStorage";
import { useFayda } from "../FaydaContext";
import { useSettings } from "../SettingsContext";

type Props = { onClose: () => void };

export function ThresholdSettingsModal({ onClose }: Props) {
  const { can } = useAuth();
  const { verification } = useFayda();
  const { settings, updateSettings } = useSettings();
  const [price, setPrice] = useState(String(settings.price));
  const [repeatSupplier, setRepeatSupplier] = useState(String(settings.repeatSupplier));
  const [delay, setDelay] = useState(String(settings.delay));

  const save = () => {
    if (!can("changeThresholds") || !isCurrentVerification(verification)) return;
    updateSettings({ price: Number(price) || 0, repeatSupplier: Number(repeatSupplier) || 0, delay: Number(delay) || 0 });
    onClose();
  };
  const resetDefaults = () => {
    setPrice(String(1_500_000));
    setRepeatSupplier(String(2));
    setDelay(String(30));
  };

  return (
    <ModalShell open={true} onClose={onClose} titleEn="Threshold Settings" titleAm="የገደብ ማደራጃ" ariaLabel="Threshold settings">
      <p className="text-[13px] text-[#2c5245] font-medium leading-relaxed mt-1">
        Adjust the demo thresholds used for signal detection. · ለማሳያ ምልክት ስሌት የሚሰሩ የማሳያ ገደቦችን ያስተካክሉ።
      </p>

      <div className="mt-5 grid gap-4">
        <label className="block">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#173f35]">Price threshold (ETB) · የዋጋ ገደብ (ብር)</span>
          <span className="block text-[10px] text-[#6b7a58] mb-1">Unit price comparison signal</span>
          <input type="number" min="0" step="10000" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-lg border-2 border-[#d6cfa5] bg-[#fffdf8] px-4 py-3 text-[15px] text-[#173f35] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#e9c867] focus:border-[#c9a74d] transition" />
        </label>
        <label className="block">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#173f35]">Repeat supplier wins · ተደጋጋሚ አቅራቢ አሸናፊ</span>
          <span className="block text-[10px] text-[#6b7a58] mb-1">Repetition signal count</span>
          <input type="number" min="2" step="1" value={repeatSupplier} onChange={(e) => setRepeatSupplier(e.target.value)} className="w-full rounded-lg border-2 border-[#d6cfa5] bg-[#fffdf8] px-4 py-3 text-[15px] text-[#173f35] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#e9c867] focus:border-[#c9a74d] transition" />
        </label>
        <label className="block">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#173f35]">Delay threshold (days) · የመዘግየት ገደብ (ቀናት)</span>
          <span className="block text-[10px] text-[#6b7a58] mb-1">Overdue approval or payment signal</span>
          <input type="number" min="1" step="1" value={delay} onChange={(e) => setDelay(e.target.value)} className="w-full rounded-lg border-2 border-[#d6cfa5] bg-[#fffdf8] px-4 py-3 text-[15px] text-[#173f35] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#e9c867] focus:border-[#c9a74d] transition" />
        </label>
      </div>

      <div className="mt-6 flex gap-3 justify-end">
        <button type="button" onClick={resetDefaults} className="rounded-lg px-5 py-2.5 text-[13px] font-bold bg-[#e8e4d0] text-[#5d6a55] border border-[#c9bfa0] shadow-sm hover:bg-[#dbcfa6] hover:border-[#bfa874] transition">
          Reset defaults · ነባር ይመልሱ
        </button>
        <button type="button" onClick={save} className="rounded-lg px-6 py-2.5 text-[13px] font-extrabold bg-[#173f35] text-white shadow-md hover:opacity-95 transition">
          Save thresholds · ገደቦችን ማሰር
        </button>
      </div>
    </ModalShell>
  );
}
