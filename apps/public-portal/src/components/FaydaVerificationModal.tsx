import { useEffect, useState } from "react";
import type { Language } from "../types";
import { FAYDA_DEMO_VERIFIED_FIN, type FaydaAuthFailureCode, type FaydaAuthenticationResult } from "../services/faydaService";
import { useFayda } from "../FaydaContext";

// ---------------------------------------------------------------------------
// Fayda eKYC verification modal — master plan Step 3.
// Takes a 12-digit FIN, runs the Step 2 mock OIDC flow, and clearly shows the
// outcome: Verified with the minimal data returned (full name, address,
// biometric status), or the specific typed rejection. Everything is labeled
// as a mock — no real NIDP credential or identity is involved.
// ---------------------------------------------------------------------------

const COPY: Record<string, { en: string; am: string }> = {
  title: { en: "Fayda eKYC verification", am: "የፋይዳ eKYC ማረጋገጫ" },
  subtitle: { en: "Simulated Ethiopian National ID verification (mock NIDP).", am: "የኢትዮጵያ ብሔራዊ መታወቂያ (NIDP) ማረጋገጫ ሙከራ።" },
  fin: { en: "12-digit FIN", am: "ባለ 12 አሃዝ FIN" },
  placeholder: { en: "e.g. 123456789012", am: "ለምሳሌ 123456789012" },
  verify: { en: "Verify with Fayda", am: "በፋይዳ አረጋግጥ" },
  verifying: { en: "Checking mock NIDP…", am: "በሙከራ NIDP በመፈተሽ ላይ…" },
  close: { en: "Close dialog", am: "ውይይት ዝጋ" },
  tryThese: { en: "Try these demo FINs:", am: "እነዚህን የማሳያ FINዎች ይሞክሩ፦" },
  verified: { en: "verified", am: "ተረጋግጧል" },
  notRegistered: { en: "not registered", am: "አልተመዘገበም" },
  outage: { en: "outage", am: "መቋረጥ" },
  honest: {
    en: "Simulated mock only — no real NIDP data or credential is produced.",
    am: "ሙከራ ብቻ — እውነተኛ የNIDP መረጃም ሆነ ምስክርነት አይወጣም።",
  },
  successTitle: { en: "Identity verified", am: "ማንነት ተረጋግጧል" },
  fullName: { en: "Full name", am: "ሙሉ ስም" },
  address: { en: "Address", am: "አድራሻ" },
  biometric: { en: "Biometric", am: "ባዮሜትሪክ" },
  biometricOk: { en: "Matched", am: "ተጣጥሟል" },
  failedTitle: { en: "Verification failed", am: "ማረጋገጫ አልተሳካም" },
};

/** Bilingual, code-specific failure guidance (pure, for reuse + tests). */
export function faydaErrorMessage(code: FaydaAuthFailureCode): { en: string; am: string } {
  switch (code) {
    case "invalid_fin":
      return {
        en: "A Fayda Identification Number must be exactly 12 digits.",
        am: "የፋይዳ መታወቂያ ቁጥር በትክክል 12 አሃዞች መሆን አለበት።",
      };
    case "fin_not_found":
      return {
        en: "No registered identity matches this FIN in the mock NIDP.",
        am: "ይህ FIN በሙከራ NIDP ውስጥ ከተመዘገበ ማንነት ጋር አልተጣመረም።",
      };
    case "nidp_unavailable":
      return {
        en: "The mock NIDP is temporarily unavailable. Try again in a moment.",
        am: "የሙከራ NIDP ለጊዜው አይገኝም። ለአፍታ ቆይተው እንደገና ይሞክሩ።",
      };
    case "demo_only":
      return {
        en: "Sign in and restart the demo verification.",
        am: "ወደ መግቢያ ገብተው የማሳያ ማረጋገጫውን እንደገና ይጀምሩ።",
      };
  }
}

const FAILURE_STYLES: Record<FaydaAuthFailureCode, string> = {
  invalid_fin: "border-amber-200 bg-amber-50 text-amber-800",
  fin_not_found: "border-red-200 bg-red-50 text-red-800",
  nidp_unavailable: "border-slate-200 bg-slate-50 text-slate-700",
  demo_only: "border-slate-200 bg-slate-50 text-slate-700",
};

type FaydaOutcomeProps = {
  language: Language;
  result: FaydaAuthenticationResult;
};

/** Presentational outcome: Verified minimal data or the typed rejection. */
export function FaydaOutcome({ language, result }: FaydaOutcomeProps) {
  const showEn = language !== "am";
  const showAm = language !== "en";
  const text = (key: string) => {
    const copy = COPY[key];
    if (language === "am") return copy.am;
    if (language === "en") return copy.en;
    return `${copy.en} · ${copy.am}`;
  };

  if (!result.ok) {
    const message = faydaErrorMessage(result.code);
    return (
      <div role="status" className={`mt-4 rounded-lg border px-4 py-3 text-[13px] ${FAILURE_STYLES[result.code]}`}>
        <p className="font-bold">
          {showEn && COPY.failedTitle.en}
          {showEn && showAm && " · "}
          {showAm && COPY.failedTitle.am}
        </p>
        <p className="mt-1">
          {showEn && message.en}
          {showEn && showAm && <br />}
          {showAm && message.am}
        </p>
      </div>
    );
  }

  return (
    <div role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
      <p className="flex items-center gap-2 text-[13px] font-bold text-emerald-800">
        <span aria-hidden="true">✓</span>
        {text("successTitle")}
      </p>
      <dl className="mt-2 space-y-1 text-[13px] text-emerald-900">
        <div className="flex gap-2">
          <dt className="font-bold">{text("fullName")}:</dt>
          <dd>{result.minimalData.fullName}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-bold">{text("address")}:</dt>
          <dd>{result.minimalData.address}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-bold">{text("biometric")}:</dt>
          <dd>{text("biometricOk")} ✓</dd>
        </div>
      </dl>
    </div>
  );
}

type FaydaVerificationModalProps = {
  language: Language;
  onClose: () => void;
};

export function FaydaVerificationModal({ language, onClose }: FaydaVerificationModalProps) {
  const [fin, setFin] = useState("");
  const [result, setResult] = useState<FaydaAuthenticationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { verify } = useFayda();

  const showEn = language !== "am";
  const showAm = language !== "en";
  const text = (key: string) => {
    const copy = COPY[key];
    if (language === "am") return copy.am;
    if (language === "en") return copy.en;
    return `${copy.en} · ${copy.am}`;
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleVerify = async () => {
    if (loading) return;
    setLoading(true);
    setResult(null);
    try {
      setResult(await verify(fin));
    } finally {
      setLoading(false);
    }
  };

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
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-bold text-[#173f35]">
              {showEn && COPY.title.en}
              {showEn && showAm && <span className="text-[#6d527f]"> · </span>}
              {showAm && COPY.title.am}
            </h2>
            <p className="mt-1 text-[11px] text-[#5e6d68]">
              {showEn && COPY.subtitle.en}
              {showEn && showAm && <br />}
              {showAm && COPY.subtitle.am}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={text("close")} className="rounded-md border border-[#d2d8d0] px-2 py-1 text-[13px] text-[#5e6d68]">
            ✕
          </button>
        </div>

        <label className="mt-5 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#5e6d68]">
          {text("fin")}
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={12}
            value={fin}
            onChange={(event) => {
              setFin(event.target.value.replace(/\D/g, "").slice(0, 12));
              setResult(null);
            }}
            placeholder={COPY.placeholder.en}
            className="mt-1 w-full rounded-md border border-[#c9d3cd] bg-white px-3 py-2 text-[14px] font-normal normal-case tracking-normal text-[#173f35]"
          />
        </label>

        <button
          type="button"
          onClick={handleVerify}
          disabled={loading || fin.length === 0}
          className="mt-4 w-full rounded-md bg-[#173f35] px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? text("verifying") : text("verify")}
        </button>

        <p className="mt-3 text-[10px] text-[#5e6d68]">
          {text("tryThese")}
          <span className="block">
            {FAYDA_DEMO_VERIFIED_FIN} ({text("verified")}) · 991234567890 ({text("notRegistered")}) · 000000000000 ({text("outage")})
          </span>
        </p>

        {result && <FaydaOutcome language={language} result={result} />}

        <p className="mt-4 border-t border-[#e0e3dd] pt-3 text-[10px] italic text-[#5e6d68]">{text("honest")}</p>
      </div>
    </div>
  );
}
