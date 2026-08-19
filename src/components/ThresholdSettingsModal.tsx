import { useState, useEffect } from "react";
import { useSettings } from "../SettingsContext";
import { Dual } from "./Dual";

export function ThresholdSettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useSettings();
  const [price, setPrice] = useState(String(settings.price));
  const [repeatSupplier, setRepeatSupplier] = useState(String(settings.repeatSupplier));
  const [delay, setDelay] = useState(String(settings.delay));

  const save = () => {
    updateSettings({
      price: Number(price) || 0,
      repeatSupplier: Number(repeatSupplier) || 0,
      delay: Number(delay) || 0,
    });
    onClose();
  };

  const resetDefaults = () => {
    setPrice(String(1_500_000));
    setRepeatSupplier(String(2));
    setDelay(String(30));
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal aria-label="Threshold settings">
      <div className="modal">
        <div className="modal-header">
          <h2><Dual en="Threshold Settings" am="የገደብ ማደራጃ" /></h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="modal-sub">
          <Dual en="Adjust the demo thresholds used for signal detection." am="ለማሳያ ምልክት ስሌት የሚሰሩ የማሳያ ገደቦችን ያስተካክሉ።" />
        </p>

        <div className="form-grid">
          <label>
            <span><Dual en="Price threshold (ETB)" am="የዋጋ ገደብ (ብር)" /></span>
            <input type="number" min="0" step="10000" value={price} onChange={(e) => setPrice(e.target.value)} />
          </label>
          <label>
            <span><Dual en="Repeat supplier wins" am="ተደጋጋሚ አቅራቢ አሸናፊ" /></span>
            <input type="number" min="2" step="1" value={repeatSupplier} onChange={(e) => setRepeatSupplier(e.target.value)} />
          </label>
          <label>
            <span><Dual en="Delay threshold (days)" am="የመዘግየት ገደብ (ቀናት)" /></span>
            <input type="number" min="1" step="1" value={delay} onChange={(e) => setDelay(e.target.value)} />
          </label>
        </div>

        <div className="modal-actions">
          <button className="secondary" type="button" onClick={resetDefaults}><Dual en="Reset defaults" am="ነባር ይመልሱ" /></button>
          <button className="primary" type="button" onClick={save}><Dual en="Save thresholds" am="ገደቦችን ማሰር" /></button>
        </div>
      </div>
    </div>
  );
}
