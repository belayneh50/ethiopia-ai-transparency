import { useAuth } from '../auth/AuthContext';
import { useState, useRef } from "react";
import { Dual } from "./Dual";
import type { ComparableListing } from "../marketReference";
import type { AuditSessionExport, Language, RecordItem } from "../types";

type ExportAuditModalProps = {
  records: RecordItem[];
  comparablesByRecord: Record<string, ComparableListing[]>;
  language: Language;
  onClose: () => void;
  onImportSession: (session: AuditSessionExport) => Promise<void>;
};

export function ExportAuditModal({
  records,
  comparablesByRecord,
  language,
  onClose,
  onImportSession,
}: ExportAuditModalProps) {
  const { can } = useAuth();
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showEn = language !== "am";
  const showAm = language !== "en";
  const fieldText = (en: string, am: string) =>
    language === "am" ? am : language === "en" ? en : `${en} · ${am}`;

  const handleExportJson = () => {
    const payload: AuditSessionExport = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      appName: "Ethiopia AI Transparency (ግልጽ ግዥ)",
      records,
      comparablesByRecord,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ethiopia-procurement-audit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const headers = [
      "Record ID",
      "Item (EN)",
      "Item (AM)",
      "Category",
      "Buyer",
      "Supplier",
      "Value (ETB)",
      "Quantity",
      "Unit",
      "Status",
      "Days Open",
      "Bids Received",
      "Signals",
      "Human Review Status",
      "Reviewer Note",
      "Review Date",
    ];

    const escapeCsv = (str: string | number | undefined) => {
      if (str === undefined || str === null) return '""';
      const s = String(str).replaceAll('"', '""');
      return `"${s}"`;
    };

    const rows = records.map((r) => [
      escapeCsv(r.id),
      escapeCsv(r.item),
      escapeCsv(r.itemAm),
      escapeCsv(r.category),
      escapeCsv(r.buyer),
      escapeCsv(r.supplier),
      escapeCsv(r.value),
      escapeCsv(r.quantity),
      escapeCsv(r.unit),
      escapeCsv(r.status),
      escapeCsv(r.daysOpen),
      escapeCsv(r.bids),
      escapeCsv(r.signals.join("; ")),
      escapeCsv(r.reviewStatus || "Pending"),
      escapeCsv(r.reviewNote || ""),
      escapeCsv(r.reviewDate || ""),
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ethiopia-procurement-records-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setImporting(true);
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text) as AuditSessionExport;
        if (!parsed.records || !Array.isArray(parsed.records) || !parsed.records.length) {
          throw new Error("Invalid session file structure: missing records array.");
        }
        await onImportSession(parsed);
        setImportSuccess(true);
        window.setTimeout(() => {
          onClose();
        }, 1200);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to parse session file.";
        setImportError(msg);
      } finally { setImporting(false); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="modal export-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="close" onClick={onClose} aria-label="Close dialog">
          ×
        </button>

        <p className="eyebrow">
          <Dual en="SESSION DATA MANAGEMENT" am="የግምገማ መረጃ አስተዳደር" separator="" />
        </p>
        <h2 id="export-title">
          <span className="en-only">Export & Import Audit Session</span>
          <span className="am-only">የግምገማ መረጃን አስመጣ እና ላክ</span>
        </h2>

        <p className="export-intro">
          <Dual
            en="Export your permitted database records. Admins can import a browser/session snapshot; duplicate IDs are skipped without overwriting database records."
            am="ፈቃድ ያላቸውን የዳታቤዝ መዝገቦች ያውርዱ። አስተዳዳሪዎች ቅጂ ሊያስገቡ ይችላሉ፤ ተመሳሳይ መለያዎች ሳይቀየሩ ይዘለላሉ።"
          />
        </p>

        {importSuccess ? (
          <div className="modal-success">
            <div className="success-checkmark">✓</div>
            <h3>
              <Dual en="Audit session restored successfully!" am="የግምገማ ፋይል በተሳካ ሁኔታ ተመልሷል!" />
            </h3>
          </div>
        ) : (
          <div className="export-grid">
            {/* Export section */}
            <div className="export-card">
              <h3>
                <Dual en="1. Export Current Session" am="1. የአሁኑን የግምገማ መረጃ አውርድ" />
              </h3>
              <p>
                <Dual
                  en={`Includes ${records.length} records, local reviewer statuses, notes, and custom market listings.`}
                  am={`${records.length} መዝገቦችን፣ የአካባቢ ግምገማዎችን፣ ማስታወሻዎችን እና ብጁ የገበያ ዝርዝሮችን ያካትታል።`}
                />
              </p>
              <div className="export-btn-group">
                <button className="btn-export-json" onClick={handleExportJson}>
                  <Dual en="Download JSON (Full Session)" am="JSON አውርድ (ሙሉ መረጃ)" />
                </button>
                <button className="btn-export-csv" onClick={handleExportCsv}>
                  <Dual en="Download CSV (Spreadsheet)" am="CSV አውርድ (ሠንጠረዥ)" />
                </button>
              </div>
            </div>

            {/* Import section */}
            {can('importSession') && <div className="export-card">
              <h3>
                <Dual en="2. Restore Saved Session" am="2. የተቀመጠ የግምገማ ፋይል ጫን" />
              </h3>
              <p>
                <Dual
                  en="Select a previously exported .json audit session file to load into this browser."
                  am="በዚህ አሳሽ ውስጥ ለመጫን ቀደም ሲል የተላከውን የ.json ፋይል ይምረጡ።"
                />
              </p>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <button
                className="btn-import"
                disabled={importing} onClick={() => fileInputRef.current?.click()}
              >
                <Dual en="Choose JSON Session File…" am="የJSON ፋይል ምረጥ…" />
              </button>
              {importError && (
                <p className="form-error" role="alert">
                  {importError}
                </p>
              )}
            </div>}


          </div>
        )}
      </section>
    </div>
  );
}
