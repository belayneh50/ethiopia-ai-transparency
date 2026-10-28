import type { Language } from "../types";
import type { TransparencyAuditResult } from "../services/geminiService";

export type AuditTone = "high" | "medium" | "low";

/** Deterministic tone bucket used for the score's visual treatment. */
export function auditTone(score: number): AuditTone {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

const TONE_STYLES: Record<AuditTone, { text: string; chip: string }> = {
  high: { text: "text-success", chip: "bg-success-soft text-success ring-success-line" },
  medium: { text: "text-warning", chip: "bg-warning-soft text-warning ring-warning-line" },
  low: { text: "text-danger", chip: "bg-danger-soft text-danger ring-danger-line" },
};

const COPY: Record<string, { en: string; am: string }> = {
  score: { en: "Transparency score", am: "የግልጽነት ነጥብ" },
  bottlenecks: { en: "Identified bottlenecks", am: "የታወቁ ችግሮች" },
  recommendations: { en: "Recommended next checks", am: "የሚመከሩ ተጨማሪ ምርመራዎች" },
  sourceGemini: { en: "AI audit · Gemini", am: "AI ኦዲት · Gemini" },
  sourceFallback: { en: "Offline demo audit (Gemini unavailable)", am: "ከመስመር ውጭ የማሳያ ኦዲት (Gemini አይገኝም)" },
  reasonunconfigured: { en: "Reason: no GEMINI_API_KEY configured on the API server", am: "ምክንያት፦ በAPI ሰርቨሩ ላይ GEMINI_API_KEY አልተዋቀረም" },
  reasonquota: { en: "Reason: provider rate limit or quota reached — try again shortly", am: "ምክንያት፦ የአገልግሎት ጊዜ ወሰን (quota) ሞልቷል — እባክዎ በቅርቡ እንደገና ይሞክሩ" },
  reasonupstream: { en: "Reason: provider rejected the request — check GEMINI_MODEL / key validity", am: "ምክንያት፦ አቅራቢው ጥያቄውን አልተቀበለም — GEMINI_MODEL እና ቁልፉን ያረጋግጡ" },
  reasonnetwork: { en: "Reason: network request to the provider failed — check connectivity", am: "ምክንያት፦ ወደ አቅራቢው ያለው የአውታረ መረብ ጥያቄ አልተሳካም — ግንኙነቱን ያረጋግጡ" },
  reasonresponse_contract: { en: "Reason: provider response did not match the expected structure", am: "ምክንያት፦ የአቅራቢው መልስ በተጠበቀው አቀማመጥ አልመጣም" },
  disclaimer: {
    en: "Synthetic demonstration only. Verify every point against source documents.",
    am: "ሰው ሰራሽ ማሳያ ብቻ። እያንዳንዱን ነጥብ ከመነሻ ሰነዶች ጋር ያረጋግጡ።",
  },
};

type AuditResultViewProps = {
  result: TransparencyAuditResult;
  language: Language;
};

export function AuditResultView({ result, language }: AuditResultViewProps) {
  const showEn = language !== "am";
  const showAm = language !== "en";
  const text = (key: string) => {
    const copy = COPY[key];
    if (language === "am") return copy.am;
    if (language === "en") return copy.en;
    return `${copy.en} · ${copy.am}`;
  };
  const tone = TONE_STYLES[auditTone(result.transparencyScore)];

  const renderItems = (en: string[], am: string[]) => (
    <>
      {showEn && en.length > 0 && (
        <ul className="list-disc pl-5 space-y-1.5 text-[13px] leading-relaxed">
          {en.map((item, index) => <li key={`en-${index}`}>{item}</li>)}
        </ul>
      )}
      {showAm && am.length > 0 && (
        <ul className="list-disc pl-5 space-y-1.5 text-[13px] leading-relaxed">
          {am.map((item, index) => <li key={`am-${index}`}>{item}</li>)}
        </ul>
      )}
    </>
  );

  return (
    <div className="mt-6 border border-line-soft dark:border-line-strong rounded-lg bg-white dark:bg-page p-5" aria-label={text("score")}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className={`inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ring-1 ${tone.text} ${tone.chip}`}>
          {result.transparencyScore}
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-purple">{text("score")}</p>
          <p className={`text-[10px] font-bold uppercase tracking-[0.08em] mt-1 ${result.source === "gemini" ? "text-success" : "text-gold-text"}`}>
            {result.source === "gemini" ? text("sourceGemini") : text("sourceFallback")}
          </p>
          {result.source === "fallback" && result.fallbackReason && COPY[`reason${result.fallbackReason}`] && (
            <p className="text-[10px] mt-0.5 text-gold-text">{text(`reason${result.fallbackReason}`)}</p>
          )}
        </div>
      </div>

      <h4 className="mt-5 mb-2 text-[12px] font-bold text-brand-text">{text("bottlenecks")}</h4>
      {renderItems(result.identifiedBottlenecksEn, result.identifiedBottlenecksAm)}

      <h4 className="mt-5 mb-2 text-[12px] font-bold text-brand-text">{text("recommendations")}</h4>
      {renderItems(result.recommendationsEn, result.recommendationsAm)}

      <p className="mt-5 border-t border-line-soft dark:border-line-strong pt-3 text-[10px] italic text-soft dark:text-soft">{text("disclaimer")}</p>
    </div>
  );
}
