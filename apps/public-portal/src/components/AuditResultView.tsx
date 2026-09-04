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
  high: { text: "text-emerald-700", chip: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  medium: { text: "text-amber-700", chip: "bg-amber-50 text-amber-800 ring-amber-200" },
  low: { text: "text-red-700", chip: "bg-red-50 text-red-800 ring-red-200" },
};

const COPY: Record<string, { en: string; am: string }> = {
  score: { en: "Transparency score", am: "የግልጽነት ነጥብ" },
  bottlenecks: { en: "Identified bottlenecks", am: "የታወቁ ችግሮች" },
  recommendations: { en: "Recommended next checks", am: "የሚመከሩ ተጨማሪ ምርመራዎች" },
  sourceGemini: { en: "AI audit · Gemini", am: "AI ኦዲት · Gemini" },
  sourceFallback: { en: "Offline demo audit (Gemini unavailable)", am: "ከመስመር ውጭ የማሳያ ኦዲት (Gemini አይገኝም)" },
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
    <div className="mt-6 border border-[#d2d8d0] rounded-lg bg-white p-5" aria-label={text("score")}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className={`inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ring-1 ${tone.text} ${tone.chip}`}>
          {result.transparencyScore}
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6d527f]">{text("score")}</p>
          <p className={`text-[10px] font-bold uppercase tracking-[0.08em] mt-1 ${result.source === "gemini" ? "text-[#386553]" : "text-[#835f27]"}`}>
            {result.source === "gemini" ? text("sourceGemini") : text("sourceFallback")}
          </p>
        </div>
      </div>

      <h4 className="mt-5 mb-2 text-[12px] font-bold text-[#173f35]">{text("bottlenecks")}</h4>
      {renderItems(result.identifiedBottlenecksEn, result.identifiedBottlenecksAm)}

      <h4 className="mt-5 mb-2 text-[12px] font-bold text-[#173f35]">{text("recommendations")}</h4>
      {renderItems(result.recommendationsEn, result.recommendationsAm)}

      <p className="mt-5 border-t border-[#e0e3dd] pt-3 text-[10px] italic text-[#5e6d68]">{text("disclaimer")}</p>
    </div>
  );
}
