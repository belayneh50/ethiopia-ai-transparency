import { useEffect, useState } from "react";
import type { Language } from "../types";
import { FAYDA_DEMO_VERIFIED_FIN, type FaydaAuthFailureCode, type FaydaAuthenticationResult } from "../services/faydaService";
import { useFayda } from "../FaydaContext";
import { ModalShell } from "./ModalShell";

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

export function faydaErrorMessage(code: FaydaAuthFailureCode): { en: string; am: string } {
  switch (code) {
    case "invalid_fin": return { en: "A Fayda Identification Number must be exactly 12 digits.", am: "የፋይዳ መታወቂያ ቁጥር በትክክል 12 አሃዞች መሆን አለበት።" };
    case "fin_not_found": return { en: "No registered identity matches this FIN in the mock NIDP.", am: "ይህ FIN በሙከራ NIDP ውስጥ ከተመዘገበ ማንነት ጋር አልተጣመረም።" };
    case "nidp_unavailable": return { en: "The mock NIDP is temporarily unavailable. Try again in a moment.", am: "የሙከራ NIDP ለጊዜው አይገኝም። ለአፍታ ቆይተው እንደገና ይሞክሩ።" };
    case "demo_only": return { en: "Sign in and restart the demo verification.", am: "ወደ መግቢያ ገብተው የማሳያ ማረጋገጫውን እንደገና ይጀምሩ።" };
  }
}

const FAILURE_STYLES: Record<FaydaAuthFailureCode, string> = {
  invalid_fin: "border-amber-200 bg-amber-50 text-amber-800",
  fin_not_found: "border-red-200 bg-red-50 text-red-800",
  nidp_unavailable: "border-slate-200 bg-slate-50 text-slate-700",
  demo_only: "border-slate-200 bg-slate-50 text-slate-700",
};

type OutcomeProps = { language: Language; result: FaydaAuthenticationResult };
export function FaydaOutcome({ language, result }: OutcomeProps) {
  const showEn = language !== "am"; const showAm = language !== "en";
  const text = (k: string) => { const c = COPY[k as keyof typeof COPY] as { en: string; am: string } | undefined; return c ? (language === "am" ? c.am : language === "en" ? c.en : `${c.en} · ${c.am}`) : k; };
  if (!result.ok) {
    const msg = faydaErrorMessage(result.code);
    return (
      <div role="status" className={`mt-4 rounded-lg border px-4 py-3 text-[13px] leading-relaxed ${FAILURE_STYLES[result.code]}`}>
        <p className="font-bold">{showEn && (COPY.failedTitle as { en: string; am: string }).en}{showEn && showAm && " · "}{showAm && (COPY.failedTitle as { en: string; am: string }).am}</p>
        <p className="mt-1">{showEn && msg.en}{showEn && showAm && <br />}{showAm && msg.am}</p>
      </div>
    );
  }
  return (
    <div role="status" className="mt-5 rounded-xl border-2 border-emerald-200 bg-emerald-50/40 px-5 py-4 shadow-inner">
      <p className="flex items-center gap-2 text-[15px] font-extrabold text-emerald-800 tracking-tight">
        <span aria-hidden="true" className="inline-grid place-items-center w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold">✓</span>
        <span>{text("successTitle")}</span>
      </p>
      <dl className="mt-3 space-y-1.5 text-[13px] text-[#2a5244]">
        <div className="flex gap-3"><dt className="font-extrabold min-w-[88px] text-[#173f35]">{text("fullName")}:</dt><dd className="text-[#2c5245]">{result.minimalData.fullName}</dd></div>
        <div className="flex gap-3"><dt className="font-extrabold min-w-[88px] text-[#173f35]">{text("address")}:</dt><dd className="text-[#2c5245]">{result.minimalData.address}</dd></div>
        <div className="flex gap-3"><dt className="font-extrabold min-w-[88px] text-[#173f35]">{text("biometric")}:</dt><dd className="text-[#2c5245]">{text("biometricOk")} ✓</dd></div>
      </dl>
    </div>
  );
}

type Props = { language: Language; onClose: () => void };
export function FaydaVerificationModal({ language, onClose }: Props) {
  const [fin, setFin] = useState("");
  const [result, setResult] = useState<FaydaAuthenticationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { verify } = useFayda();

  const showEn = language !== "am"; const showAm = language !== "en";
  const text = (k: string) => { const c = COPY[k as keyof typeof COPY] as { en: string; am: string } | undefined; return c ? (language === "am" ? c.am : language === "en" ? c.en : `${c.en} · ${c.am}`) : k; };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleVerify = async () => {
    if (loading) return;
    setLoading(true); setResult(null);
    try {
      const r = await verify(fin);
      setResult(r);
      if (r.ok) { setTimeout(() => onClose(), 1800); }
    } finally { setLoading(false); }
  };

  return (
    <ModalShell open={true} onClose={onClose} titleEn={COPY.title.en} titleAm={COPY.title.am} ariaLabel={text("title")}>
      {/* Subtitle more readable */}
      <p className="text-[13px] text-[#2c5245] font-medium leading-relaxed mt-1">
        {showEn && COPY.subtitle.en}{showEn && showAm && <br />}{showAm && COPY.subtitle.am}
      </p>

      {/* Label above input (English first, Amharic slightly smaller beneath) */}
      <label className="mt-5 block">
        <span className="block text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#173f35]">{text("fin")}</span>
        <span className="block text-[10px] text-[#6b7a58] font-medium mb-1">{showAm ? COPY.subtitle.am : "12-digit synthetic demonstration number"}</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={12}
          value={fin}
          onChange={(e) => { setFin(e.target.value.replace(/\D/g, "").slice(0, 12)); setResult(null); }}
          placeholder={COPY.placeholder.en}
          className="w-full rounded-lg border-2 border-[#d6cfa5] bg-[#fffdf8] px-4 py-3 text-[15px] text-[#173f35] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#e9c867] focus:border-[#c9a74d] transition"
        />
      </label>

      {/* Primary action: green; secondary: quiet */}
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading || fin.length < 1}
          className="flex-1 rounded-lg bg-[#173f35] px-5 py-2.5 text-[13px] font-extrabold text-white shadow-md hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {loading ? text("verifying") : text("verify")}
        </button>
      </div>

      {/* Demo hints */}
      <p className="mt-3 text-[12px] text-[#556b4a] font-medium">
        {text("tryThese")} <span className="block text-[11px] text-[#3a5c3a]">{FAYDA_DEMO_VERIFIED_FIN} ({text("verified")}) · 991234567890 ({text("notRegistered")}) · 000000000000 ({text("outage")})</span>
      </p>

      {/* Result / error shown clearly */}
      {result && <FaydaOutcome language={language} result={result} />}

      {/* Disclaimer - larger and readable */}
      <p className="mt-4 border-t border-[#d6cfa5] pt-3 text-[12px] text-[#556b4a] font-medium leading-relaxed">{text("honest")}</p>

      {(() => {
        // Footer actions passed as footer prop so ModalShell aligns consistently
        return null;
      })()}
    </ModalShell>
  );
}
