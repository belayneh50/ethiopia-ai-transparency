import { useAuth } from '../auth/AuthContext';
import { isCurrentVerification } from '../faydaStorage';
import { request, mapRecord } from '../recordsApi';
import { useEffect, useRef, useState } from "react";
import type { Language, RecordItem } from "../types";
import { requestTransparencyAudit, createTransparencyAuditFallback, type TransparencyAuditInput } from "../services/geminiService";
import { maskFin, useFayda } from "../FaydaContext";
import type { FaydaVerification } from "../faydaStorage";
import { AuditResultView } from "./AuditResultView";

type AuditDashboardProps = {
  language: Language;
  records: RecordItem[];
  onOpenFayda: () => void;
};

const COPY: Record<string, { en: string; am: string }> = {
  eyebrow: { en: "AI TRANSPARENCY AUDIT", am: "የAI ግልጽነት ኦዲት" },
  heading: { en: "Audit a synthetic record", am: "ሰው ሰራሽ መዝገብን ይመርምሩ" },
  intro: {
    en: "Run a structured transparency assessment of one record. The score reflects how observable the recorded process is from its fields — a demo aid, never a verdict.",
    am: "የአንድ መዝገብ የተዋቀረ የግልጽነት ግምገማ ያካሂዱ። ነጥቡ ሂደቱ ከመስኮቹ ምን ያህል እንደሚታይ ያንጸባርቃል — ማሳያ እንጂ ውሳኔ አይደለም።",
  },
  recordLabel: { en: "Record", am: "መዝገብ" },
  run: { en: "Run AI audit", am: "AI ኦዲት አሂድ" },
  running: { en: "Analysing…", am: "በመተንተን ላይ…" },
  empty: { en: "No records to audit.", am: "የሚመረመር መዝገብ የለም።" },
  fieldBuyer: { en: "Buyer", am: "ገዢ" },
  fieldSupplier: { en: "Supplier", am: "አቅራቢ" },
  fieldValue: { en: "Value (ETB)", am: "ዋጋ (ብር)" },
  fieldBids: { en: "Bids", am: "ጨረታዎች" },
  fieldOpen: { en: "Days open", am: "ክፍት ቀናት" },
  signOffIdentity: { en: "Sign-off identity", am: "የፊርማ ማንነት" },
  signOffGated: { en: "Sign-off gated — Fayda eKYC required", am: "ፊርማ የተገደበ — የፋይዳ eKYC ያስፈልጋል" },
  verifyCta: { en: "Verify with Fayda", am: "በፋይዳ አረጋግጥ" },
  signedOffBy: { en: "Signed off by", am: "የተፈረመው በ" },
  signedOffOn: { en: "on", am: "በ" },
  signOffNow: { en: "Sign off this audit report", am: "ይህን የኦዲት ሪፖርት ፈርም" },
  verifyToSignOff: {
    en: "Verify Fayda ID to sign off on this audit report.",
    am: "ይህን የኦዲት ሪፖርት ለመፈረም የፋይዳ መታወቂያ ያረጋግጡ።",
  },
};

function toAuditInput(record: RecordItem, language: Language): TransparencyAuditInput {
  return {
    language,
    id: record.id,
    item: record.item,
    category: record.category,
    buyer: record.buyer,
    supplier: record.supplier,
    value: record.value,
    date: record.date,
    status: record.status,
    daysOpen: record.daysOpen,
    bids: record.bids,
    signals: record.signals,
  };
}

function useText(language: Language) {
  const showEn = language !== "am";
  const showAm = language !== "en";
  const text = (key: string) => {
    const copy = COPY[key];
    if (language === "am") return copy.am;
    if (language === "en") return copy.en;
    return `${copy.en} · ${copy.am}`;
  };
  return { showEn, showAm, text };
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export type AuditSignOffProps = {
  language: Language;
  verification: FaydaVerification | null;
  signedOffAt: string | null;
  onOpenFayda: () => void;
  onSignOffNow: () => void;
};

/** Presentational sign-off block: verified stamp, sign-off button, or gate CTA. */
export function AuditSignOff({ language, verification, signedOffAt, onOpenFayda, onSignOffNow }: AuditSignOffProps) {
  const { text } = useText(language);

  if (verification && signedOffAt) {
    return (
      <div
        role="status"
        className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-900"
      >
        <span aria-hidden="true" className="text-[15px] font-bold text-emerald-700">✒</span>
        <span className="font-bold">{text("signedOffBy")}</span>
        <span>
          {verification.fullName} ({maskFin(verification.subjectId)}) {text("signedOffOn")} {fmtDate(signedOffAt)}
        </span>
      </div>
    );
  }

  if (verification) {
    return (
      <div className="mt-4">
        <button
          type="button"
          onClick={onSignOffNow}
          className="rounded-md border border-[#173f35] px-3 py-1.5 text-[12px] font-bold text-[#173f35] hover:bg-[#173f35] hover:text-white"
        >
          {text("signOffNow")}
        </button>
      </div>
    );
  }

  return (
    <div
      className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900"
      role="status"
    >
      <span aria-hidden="true">⚠</span>
      <span>{text("verifyToSignOff")}</span>
      <button
        type="button"
        onClick={onOpenFayda}
        className="rounded-md bg-[#173f35] px-3 py-1.5 text-[12px] font-bold text-white hover:opacity-90"
      >
        {text("verifyCta")}
      </button>
    </div>
  );
}

export function AuditDashboard({ language, records, onOpenFayda }: AuditDashboardProps) {
  const [selectedId, setSelectedId] = useState<string>(records[0]?.id ?? "");
  const [result, setResult] = useState<Awaited<ReturnType<typeof requestTransparencyAudit>> | null>(null);
  const [running, setRunning] = useState(false);
  const [signedOffAt, setSignedOffAt] = useState<string | null>(null);
  const { verification } = useFayda();
  const { can } = useAuth();
  const [error, setError] = useState('');
  const revision = useRef(0);
  const [savedVersion, setSavedVersion] = useState<number>();
  const { showEn, showAm, text } = useText(language);

  const selected = records.find((record) => record.id === selectedId) ?? records[0];

  useEffect(() => { revision.current++; setResult(null); setSignedOffAt(null); setSavedVersion(undefined); }, [selected?.id, selected?.version]);
  const handleRun = async () => {
    if (!selected || running || !can('requestGemini') || !isCurrentVerification(verification)) return;
    const current = ++revision.current;
    setSignedOffAt(null); setError('');
    setRunning(true);
    setResult(null);
    try {
      const audit = await requestTransparencyAudit(toAuditInput(selected, "both"));
      if (current !== revision.current) return;
      setResult(audit);
      // Human sign-off is a separate explicit action after reading the result.
    } catch {
      setError('Access expired or unavailable. Sign in and verify the demo again. · እንደገና ይግቡና የማሳያ ማረጋገጫውን ያጠናቅቁ።');
    } finally {
      setRunning(false);
    }
  };

  const valueLabel = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

  if (records.length === 0) {
    return (
      <section id="ai-audit" aria-label={text("heading")} className="ai-audit bg-white py-10">
        <div className="mx-auto max-w-[1100px] px-6 text-[14px] text-[#5e6d68]">{text("empty")}</div>
      </section>
    );
  }

  return (
    <section id="ai-audit" aria-label={text("heading")} className="ai-audit border-y border-[#e0e3dd] bg-white py-10">
      <div className="mx-auto max-w-[1100px] px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6d527f]">{text("eyebrow")}</p>
        <h2 className="mt-1 text-[22px] font-bold text-[#173f35]">
          {showEn && <span>{COPY.heading.en}</span>}
          {showEn && showAm && <span className="text-[#6d527f]"> · </span>}
          {showAm && <span className={showEn ? "font-normal" : ""}>{COPY.heading.am}</span>}
        </h2>
        <p className="mt-2 max-w-[760px] text-[13px] leading-relaxed text-[#5e6d68]">
          {showEn && COPY.intro.en}
          {showEn && showAm && <br />}
          {showAm && COPY.intro.am}
        </p>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5e6d68]">
            {text("recordLabel")}
            <select
              className="mt-1 min-w-[280px] rounded-md border border-[#c9d3cd] bg-white px-3 py-2 text-[13px] font-normal normal-case tracking-normal text-[#173f35]"
              value={selected?.id ?? ""}
              onChange={(event) => {
                setSelectedId(event.target.value);
                setResult(null);
                setSignedOffAt(null);
              }}
            >
              {records.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.item} ({record.id})
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleRun}
            disabled={running}
            className="rounded-md bg-[#173f35] px-4 py-2 text-[12px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            {running ? text("running") : text("run")}
          </button>

          {verification ? (
            <p className="text-[11px] text-[#2f6f4f]">
              ✓ {text("signOffIdentity")}: {verification.fullName} ({maskFin(verification.subjectId)})
            </p>
          ) : (
            <p className="flex flex-wrap items-center gap-2 text-[11px] text-[#8a6d1a]">
              <span>⚠ {text("signOffGated")}</span>
              <button
                type="button"
                onClick={onOpenFayda}
                className="rounded-md border border-[#b98a2b] px-2 py-1 text-[11px] font-bold text-[#8a6d1a] hover:bg-[#b98a2b] hover:text-white"
              >
                {text("verifyCta")}
              </button>
            </p>
          )}
        </div>

        {selected && (
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-[#5e6d68]">
            <div className="flex gap-1"><dt className="font-bold text-[#173f35]">{text("fieldBuyer")}:</dt><dd>{selected.buyer}</dd></div>
            <div className="flex gap-1"><dt className="font-bold text-[#173f35]">{text("fieldSupplier")}:</dt><dd>{selected.supplier}</dd></div>
            <div className="flex gap-1"><dt className="font-bold text-[#173f35]">{text("fieldValue")}:</dt><dd>{valueLabel(selected.value)}</dd></div>
            <div className="flex gap-1"><dt className="font-bold text-[#173f35]">{text("fieldBids")}:</dt><dd>{selected.bids}</dd></div>
            <div className="flex gap-1"><dt className="font-bold text-[#173f35]">{text("fieldOpen")}:</dt><dd>{selected.daysOpen}</dd></div>
          </dl>
        )}

        {error && <p role="alert">{error}</p>}
        {result && (
          <>
            <AuditResultView result={result} language={language} />
            <AuditSignOff
              language={language}
              verification={verification}
              signedOffAt={signedOffAt}
              onOpenFayda={onOpenFayda}
              onSignOffNow={async () => {
                if (!selected?.databaseId || !can('performHumanReview') || !isCurrentVerification(verification) || signedOffAt) return;
                try {
                  const saved = await request<{ version: number; updatedAt: string }>(`/api/records/${selected.databaseId}/audit-signoff`, 'POST', { version: savedVersion ?? selected.version, report: result });
                  setSavedVersion(saved.version); setSignedOffAt(saved.updatedAt);
                } catch (e) { setError(e instanceof Error ? e.message : 'Sign-off failed'); }
              }}
            />
          </>
        )}
      </div>
    </section>
  );
}