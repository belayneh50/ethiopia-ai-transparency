import { useState } from "react";
import { Dual } from "./Dual";
import type { AddRecordData, Language } from "../types";

type AddRecordModalProps = {
  onClose: () => void;
  onSubmit: (data: AddRecordData) => void;
  language: Language;
};

export function AddRecordModal({ onClose, onSubmit, language }: AddRecordModalProps) {
  const showEn = language !== "am";
  const showAm = language !== "en";
  const localText = (en: string, am: string) =>
    language === "am" ? am : language === "en" ? en : `${en} · ${am}`;

  const [formData, setFormData] = useState({
    item: "",
    itemAm: "",
    category: "",
    buyer: "",
    supplier: "",
    value: "",
    bids: "",
    approvalDate: "",
    paymentDate: "",
    status: "Pending approval",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const categories: Record<string, { en: string; am: string }> = {
    office: { en: "Office supplies", am: "የቢሮ ዕቃዎች" },
    ict: { en: "ICT and technology", am: "ቴክኖሎጂ" },
    medical: { en: "Medical and health supplies", am: "የጤና ዕቃዎች" },
    construction: { en: "Construction and maintenance", am: "ግንባታ እና ጥገና" },
    water: { en: "Water and sanitation", am: "ውሃ እና ንፅህና" },
    agricultural: { en: "Agricultural supplies", am: "የግብርና ዕቃዎች" },
    energy: { en: "Energy equipment", am: "የኃይል መሣሪያዎች" },
    other: { en: "Other", am: "ሌላ" },
  };

  const statusMap: Record<string, string> = {
    "Pending approval": "ማጽደቅ በመጠበቅ ላይ",
    "Awaiting payment": "ክፍያ በመጠበቅ ላይ",
    Paid: "ተከፍሏል",
  };

  const updateField = (field: string, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: "" } : current));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const required = localText("Required", "ይህ መረጃ ያስፈልጋል");

    if (showEn && !formData.item.trim()) nextErrors.item = required;
    if (showAm && !formData.itemAm.trim()) nextErrors.itemAm = required;
    if (!formData.category) nextErrors.category = required;
    if (!formData.buyer.trim()) nextErrors.buyer = required;
    if (!formData.supplier.trim()) nextErrors.supplier = required;
    if (!formData.approvalDate) nextErrors.approvalDate = required;

    const value = Number(formData.value);
    if (!Number.isFinite(value) || value <= 0)
      nextErrors.value = localText("Enter a positive amount", "ትክክለኛ የብር መጠን ያስገቡ");

    const bids = Number(formData.bids);
    if (!Number.isInteger(bids) || bids <= 0)
      nextErrors.bids = localText("Enter a positive whole number", "ትክክለኛ ሙሉ ቁጥር ያስገቡ");

    if (formData.status === "Paid" && !formData.paymentDate)
      nextErrors.paymentDate = localText("Required for paid status", "ለተከፈለ ሁኔታ የክፍያ ቀን ያስፈልጋል");

    if (formData.paymentDate && formData.approvalDate && formData.paymentDate < formData.approvalDate)
      nextErrors.paymentDate = localText(
        "Must be on or after approval date",
        "የክፍያ ቀን ከጸደቀበት ቀን እኩል ወይም በኋላ መሆን አለበት"
      );

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const category = categories[formData.category];
    setShowSuccess(true);
    window.setTimeout(() => {
      onSubmit({
        item: formData.item.trim() || formData.itemAm.trim(),
        itemAm: formData.itemAm.trim() || formData.item.trim(),
        category: category.en,
        categoryAm: category.am,
        buyer: formData.buyer.trim(),
        supplier: formData.supplier.trim(),
        value,
        bids,
        approvalDate: formData.approvalDate,
        paymentDate: formData.paymentDate,
        status: formData.status,
        statusAm: statusMap[formData.status],
      });
    }, 1500);
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="modal add-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="close"
          onClick={onClose}
          aria-label={localText("Close form", "ቅጹን ዝጋ")}
        >
          ×
        </button>
        <h2 id="add-title">
          <span className="en-only">Add sample record</span>
          <span className="am-only">የሙከራ መዝገብ ጨምር</span>
        </h2>
        <div className="data-notice-form">
          <span className="note-icon">i</span>
          <p>
            <strong>
              <Dual en="Synthetic demo data only" am="ሰው ሰራሽ የማሳያ መረጃ ብቻ" />
            </strong>
            <Dual
              en="This form creates synthetic demo data for this browser session. Do not enter real procurement, personal, biometric, confidential, or government data."
              am="ይህ ቅጽ ለዚህ የአሳሽ ክፍለ ጊዜ ሰው ሰራሽ የማሳያ መረጃ ብቻ ይፈጥራል። እውነተኛ የግዥ፣ የግል፣ ባዮሜትሪክ፣ ሚስጥራዊ ወይም የመንግሥት መረጃ አያስገቡ።"
            />
          </p>
        </div>

        {showSuccess ? (
          <div className="modal-success">
            <div className="success-checkmark">✓</div>
            <h3>
              <span className="en-only">Sample record added successfully.</span>
              <span className="am-only">የሙከራ መዝገብ በተሳካ ሁኔታ ታክሏል።</span>
            </h3>
            <p>
              <span className="en-only">Pending authorized human review.</span>
              <span className="am-only">ፈቃድ ያለው የሰው ግምገማ በመጠበቅ ላይ።</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="add-form">
            {showEn && showAm && (
              <div className="bilingual-headers">
                <span className="lang-header">English</span>
                <span className="lang-header lang-header-am">አማርኛ</span>
              </div>
            )}
            <div className={showEn && showAm ? "form-row-bilingual" : "form-single"}>
              {showEn && (
                <div className="form-field">
                  <label htmlFor="sample-item-en">Item name *</label>
                  <input
                    id="sample-item-en"
                    value={formData.item}
                    onChange={(event) => updateField("item", event.target.value)}
                    placeholder="e.g., Office chairs (50)"
                  />
                  {errors.item && <span className="error">{errors.item}</span>}
                </div>
              )}
              {showAm && (
                <div className="form-field">
                  <label htmlFor="sample-item-am" className="am-label">
                    የዕቃ ስም *
                  </label>
                  <input
                    id="sample-item-am"
                    value={formData.itemAm}
                    onChange={(event) => updateField("itemAm", event.target.value)}
                    placeholder="ለምሳሌ፣ የቢሮ ወንበሮች (50)"
                  />
                  {errors.itemAm && <span className="error">{errors.itemAm}</span>}
                </div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="sample-category">
                <Dual en="Category" am="ምድብ" /> *
              </label>
              <select
                id="sample-category"
                value={formData.category}
                onChange={(event) => updateField("category", event.target.value)}
              >
                <option value="">{localText("Select category", "ምድብ ይምረጡ")}</option>
                {Object.entries(categories).map(([key, category]) => (
                  <option key={key} value={key}>
                    {localText(category.en, category.am)}
                  </option>
                ))}
              </select>
              {errors.category && <span className="error">{errors.category}</span>}
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="sample-buyer">
                  <Dual en="Buyer office" am="ገዢ መሥሪያ ቤት" /> *
                </label>
                <input
                  id="sample-buyer"
                  value={formData.buyer}
                  onChange={(event) => updateField("buyer", event.target.value)}
                  placeholder={localText("Synthetic sample office", "ሰው ሰራሽ የሙከራ መሥሪያ ቤት")}
                />
                {errors.buyer && <span className="error">{errors.buyer}</span>}
              </div>
              <div className="form-field">
                <label htmlFor="sample-supplier">
                  <Dual en="Supplier name" am="የአቅራቢ ስም" /> *
                </label>
                <input
                  id="sample-supplier"
                  value={formData.supplier}
                  onChange={(event) => updateField("supplier", event.target.value)}
                  placeholder={localText("Synthetic sample supplier", "ሰው ሰራሽ የሙከራ አቅራቢ")}
                />
                {errors.supplier && <span className="error">{errors.supplier}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="sample-value">
                  <Dual en="Amount (ETB)" am="መጠን (ብር)" /> *
                </label>
                <input
                  id="sample-value"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.value}
                  onChange={(event) => updateField("value", event.target.value)}
                  placeholder="500000"
                />
                {errors.value && <span className="error">{errors.value}</span>}
              </div>
              <div className="form-field">
                <label htmlFor="sample-bids">
                  <Dual en="Bid count" am="የጨረታ ብዛት" /> *
                </label>
                <input
                  id="sample-bids"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.bids}
                  onChange={(event) => updateField("bids", event.target.value)}
                  placeholder="3"
                />
                {errors.bids && <span className="error">{errors.bids}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="sample-approval">
                  <Dual en="Approval date" am="የጸደቀበት ቀን" /> *
                </label>
                <input
                  id="sample-approval"
                  type="date"
                  value={formData.approvalDate}
                  onChange={(event) => updateField("approvalDate", event.target.value)}
                />
                {errors.approvalDate && <span className="error">{errors.approvalDate}</span>}
              </div>
              <div className="form-field">
                <label htmlFor="sample-payment">
                  <Dual en="Payment date" am="የተከፈለበት ቀን" /> {formData.status === "Paid" && "*"}
                </label>
                <input
                  id="sample-payment"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(event) => updateField("paymentDate", event.target.value)}
                  disabled={formData.status !== "Paid"}
                />
                {errors.paymentDate && <span className="error">{errors.paymentDate}</span>}
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="sample-status">
                <Dual en="Status" am="ሁኔታ" /> *
              </label>
              <select
                id="sample-status"
                value={formData.status}
                onChange={(event) => updateField("status", event.target.value)}
              >
                <option value="Pending approval">{localText("Pending approval", "ማጽደቅ በመጠበቅ ላይ")}</option>
                <option value="Awaiting payment">{localText("Awaiting payment", "ክፍያ በመጠበቅ ላይ")}</option>
                <option value="Paid">{localText("Paid", "ተከፍሏል")}</option>
              </select>
            </div>

            <div className="shield-form">
              <span>ⓘ</span>
              <p>
                <strong>
                  <Dual en="Authorized human review only" am="ፈቃድ ላለው የሰው ግምገማ ብቻ" />
                </strong>
                <Dual
                  en="Review signals are calculated locally from the entered synthetic data. They are not proof of wrongdoing."
                  am="የግምገማ ምልክቶች ከገባው ሰው ሰራሽ መረጃ በአካባቢው ይሰላሉ። የጥፋተኝነት ማስረጃ አይደሉም።"
                />
              </p>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                <Dual en="Cancel" am="ሰርዝ" separator="" />
              </button>
              <button type="submit" className="btn-submit">
                <Dual en="Add record" am="መዝገብ ጨምር" separator="" />
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
