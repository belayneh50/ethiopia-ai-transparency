import { isCurrentVerification } from '../faydaStorage';
import { useState } from "react";
import type { Language } from "../types";
import { useFayda, maskFin } from "../FaydaContext";
import { useAuth } from "../auth/AuthContext";
import {
  createFaydaVerification,
  readVendors,
  saveVendors,
  type FaydaVerification,
  type VendorRegistration,
} from "../faydaStorage";

// ---------------------------------------------------------------------------
// Vendor registration gated by Fayda eKYC — master plan checkpoint: prevent
// ghost vendors by tying every registered supplier to a verified Fayda
// identity. The flow: (1) verify the representative's 12-digit FIN through the
// mock NIDP, (2) only then register the company, (3) submit a demo bid under
// that verified identity. Everything is simulated and browser-local.
// ---------------------------------------------------------------------------

const COPY: Record<string, { en: string; am: string }> = {
  title: { en: "Vendor registration (Fayda-gated)", am: "የአቅራቢ ምዝገባ (በፋይዳ የተጠበቀ)" },
  subtitle: {
    en: "Simulated supplier registration — the representative must pass Fayda eKYC before the company can register or bid.",
    am: "የሙከራ አቅራቢ ምዝገባ — ድርጅቱ ከመመዝገቡ ወይም ከጨረታ ከመሳተፉ በፊት ተወካዩ የፋይዳ eKYC ማለፍ አለበት።",
  },
  stepIdentity: { en: "Step 1 — Verify the representative", am: "ደረጃ 1 — ተወካዩን ያረጋግጡ" },
  fin: { en: "12-digit FIN of the representative", am: "የተወካዩ ባለ 12 አሃዝ FIN" },
  placeholder: { en: "e.g. 123456789012", am: "ለምሳሌ 123456789012" },
  verify: { en: "Verify with Fayda", am: "በፋይዳ አረጋግጥ" },
  verifying: { en: "Checking mock NIDP…", am: "በሙከራ NIDP በመፈተሽ ላይ…" },
  verifiedAs: { en: "Verified as", am: "የተረጋገጠው በ" },
  identityLocked: { en: "Identity locked — registration below uses this verified person.", am: "ማንነት ተቆልፏል — ከታች ያለው ምዝገባ ይህን የተረጋገጠ ሰው ይጠቀማል።" },
  stepCompany: { en: "Step 2 — Register the company", am: "ደረጃ 2 — ድርጅቱን ይመዝግቡ" },
  company: { en: "Company name", am: "የኩባንያ ስም" },
  companyPlaceholder: { en: "e.g. Abay Sample Trading", am: "ለምሳሌ የአባይ ናሙና ንግድ" },
  representative: { en: "Representative (Fayda-verified)", am: "ተወካይ (በፋይዳ የተረጋገጠ)" },
  register: { en: "Register vendor", am: "አቅራቢ ይመዝገብ" },
  registered: { en: "Vendor registered", am: "አቅራቢ ተመዝግቧል" },
  registeredHint: {
    en: "This company is now eligible to submit bids, tied to the verified representative.",
    am: "ይህ ድርጅት አሁን ጨረታ ለማቅረብ ብቁ ነው፣ ከተረጋገጠው ተወካይ ጋር ተቆራኝቷል።",
  },
  submitBid: { en: "Submit demo bid", am: "የሙከራ ጨረታ አቅርብ" },
  bidSubmitted: { en: "Bid submitted under verified identity", am: "ጨረታ በተረጋገጠ ማንነት ቀርቧል" },
  existing: { en: "Registered vendors (this browser)", am: "የተመዘገቡ አቅራቢዎች (ይህ አሳሽ)" },
  none: { en: "None yet.", am: "እስካሁን የለም።" },
  close: { en: "Close dialog", am: "ውይይት ዝጋ" },
  tryThis: { en: "Try the demo FIN:", am: "የማሳያ FIN ይሞክሩ፦" },
  honest: {
    en: "Simulated only — no real NIDP check, credential, or bid is produced; registrations live in this browser's localStorage.",
    am: "ሙከራ ብቻ — እውነተኛ የNIDP ማረጋገጫም ሆነ ምስክርነት ወይም ጨረታ አይወጣም፤ ምዝገባዎች በዚህ አሳሽ localStorage ውስጥ ይቀመጣሉ።",
  },
};

type VendorRegistrationModalProps = {
  language: Language;
  onClose: () => void;
};

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

export function VendorRegistrationModal({ language, onClose }: VendorRegistrationModalProps) {
  const [fin, setFin] = useState("");

  const [verifying, setVerifying] = useState(false);
  const [company, setCompany] = useState("");
  const [vendors, setVendors] = useState<VendorRegistration[]>(() =>
    typeof window === "undefined" ? [] : readVendors(window.localStorage),
  );
  const [registered, setRegistered] = useState<VendorRegistration | null>(null);
  const { verify, verification: identity } = useFayda();
  const [verificationError, setVerificationError] = useState(false);
  const { user } = useAuth();
  const { showEn, showAm, text } = useText(language);

  const handleVerify = async () => {
    if (verifying) return;
    setVerifying(true);
    try {
      const result = await verify(fin);
      setVerificationError(!result.ok);
    } finally {
      setVerifying(false);
    }
  };

  const handleRegister = () => {
    if (!isCurrentVerification(identity) || !company.trim()) return;
    const registration: VendorRegistration = {
      id: `VND-${Date.now()}`,
      company: company.trim(),
      contactName: identity.fullName,
      contactSubjectId: identity.subjectId,
      verifiedAt: identity.verifiedAt,
      registeredAt: new Date().toISOString(),
    };
    const next = [...vendors, registration];
    saveVendors(window.localStorage, next);
    setVendors(next);
    setRegistered(registration);
  };

  const handleSubmitBid = () => {
    if (!registered || !isCurrentVerification(identity) || registered.contactSubjectId !== identity.subjectId) return;
    const next = vendors.map((v) =>
      v.id === registered.id ? { ...v, bidSubmittedAt: new Date().toISOString() } : v,
    );
    saveVendors(window.localStorage, next);
    setVendors(next);
    setRegistered({ ...registered, bidSubmittedAt: new Date().toISOString() });
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={text("title")}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white dark:bg-page p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-bold text-brand-text">
              {showEn && COPY.title.en}
              {showEn && showAm && <span className="text-purple"> · </span>}
              {showAm && COPY.title.am}
            </h2>
            <p className="mt-1 text-[11px] text-soft dark:text-soft">
              {showEn && COPY.subtitle.en}
              {showEn && showAm && <br />}
              {showAm && COPY.subtitle.am}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={text("close")} className="rounded-md border border-line-soft dark:border-line-strong bg-surface px-2 py-1 text-[13px] text-soft">
            ✕
          </button>
        </div>

        {verificationError && <p role="alert">Use the supplied demo identifier. · የተሰጠውን የማሳያ መለያ ይጠቀሙ።</p>}
        {/* Step 1 — Fayda verification of the representative */}
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.08em] text-purple">{text("stepIdentity")}</p>
        {identity ? (
          <div role="status" className="mt-2 rounded-lg border border-success-line bg-success-soft px-4 py-3">
            <p className="text-[13px] font-bold text-success">
              ✓ {text("verifiedAs")}: {identity.fullName}
            </p>
            <p className="mt-1 text-[12px] text-success">
              {identity.address} · FIN {maskFin(identity.subjectId)}
            </p>
            <p className="mt-1 text-[11px] italic text-success">{text("identityLocked")}</p>
          </div>
        ) : (
          <>
            <label className="mt-2 block text-[10px] font-bold uppercase tracking-[0.08em] text-soft dark:text-soft">
              {text("fin")}
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={12}
                value={fin}
                onChange={(event) => setFin(event.target.value.replace(/\D/g, "").slice(0, 12))}
                placeholder={COPY.placeholder.en}
                className="mt-1 w-full rounded-md border border-line-strong bg-white dark:bg-page px-3 py-2 text-[14px] font-normal normal-case tracking-normal text-brand-text"
              />
            </label>
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying || fin.length === 0}
              className="mt-3 w-full rounded-md bg-brand px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verifying ? text("verifying") : text("verify")}
            </button>
            <p className="mt-2 text-[10px] text-soft dark:text-soft">
              {text("tryThis")} <span className="font-mono">123456789012</span>
            </p>
          </>
        )}

        {/* Step 2 — company registration (locked until verified) */}
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.08em] text-purple">{text("stepCompany")}</p>
        <label className="mt-2 block text-[10px] font-bold uppercase tracking-[0.08em] text-soft dark:text-soft">
          {text("company")}
          <input
            type="text"
            autoComplete="off"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder={COPY.companyPlaceholder.en}
            disabled={!identity}
            className="mt-1 w-full rounded-md border border-line-strong bg-white dark:bg-page px-3 py-2 text-[14px] font-normal normal-case tracking-normal text-brand-text disabled:cursor-not-allowed disabled:bg-surface-alt"
          />
        </label>
        {identity && (
          <p className="mt-2 text-[11px] text-soft dark:text-soft">
            {text("representative")}: <b className="text-brand-text">{identity.fullName}</b> ({maskFin(identity.subjectId)})
          </p>
        )}
        <button
          type="button"
          onClick={handleRegister}
          disabled={!identity || company.trim().length === 0}
          className="mt-3 w-full rounded-md bg-brand px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {text("register")}
        </button>

        {/* Registered outcome + demo bid */}
        {registered && (
          <div role="status" className="mt-4 rounded-lg border border-success-line bg-success-soft px-4 py-3">
            <p className="text-[13px] font-bold text-success">
              ✓ {text("registered")}: {registered.company}
            </p>
            <p className="mt-1 text-[12px] text-success">
              {registered.contactName} · FIN {maskFin(registered.contactSubjectId)} · {fmtDate(registered.registeredAt)}
            </p>
            <p className="mt-1 text-[11px] italic text-success">{text("registeredHint")}</p>
            {registered.bidSubmittedAt ? (
              <p className="mt-2 rounded-md border border-success-line bg-white dark:bg-page px-3 py-2 text-[12px] font-bold text-success">
                ✓ {text("bidSubmitted")} ({fmtDate(registered.bidSubmittedAt)})
              </p>
            ) : (
              <button
                type="button"
                onClick={handleSubmitBid}
                className="mt-3 rounded-md bg-brand px-4 py-2 text-[12px] font-bold text-white hover:opacity-90"
              >
                {text("submitBid")}
              </button>
            )}
          </div>
        )}

        {/* Existing registrations */}
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.08em] text-soft dark:text-soft">{text("existing")}</p>
        {vendors.length === 0 ? (
          <p className="mt-1 text-[12px] text-soft dark:text-soft">{text("none")}</p>
        ) : (
          <ul className="mt-1 space-y-1 text-[12px] text-brand-text">
            {vendors.map((v) => (
              <li key={v.id} className="rounded-md border border-line-soft dark:border-line-strong px-3 py-2">
                <b>{v.company}</b> — {v.contactName} (sign-off {maskFin(v.contactSubjectId)}){" "}
                {v.bidSubmittedAt ? `· ${text("bidSubmitted")}` : ""}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 border-t border-line-soft dark:border-line-strong pt-3 text-[10px] italic text-soft dark:text-soft">{text("honest")}</p>
      </div>
    </div>
  );
}