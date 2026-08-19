export type GeminiReviewInput = {
  language: "both" | "am" | "en";
  id: string; item: string; category: string; buyer: string; supplier: string;
  value: number; date: string; status: string; daysOpen: number; bids: number; signals: string[];
  marketReference: { count: number; low: number; median: number; high: number; recordQuantity: number; recordUnitPrice: number; differenceFromMedian: number; percentFromMedian: number };
};

export type GeminiReviewGuidance = {
  source: "gemini" | "fallback";
  overviewEn: string; overviewAm: string;
  questionsEn: string[]; questionsAm: string[];
  limitationsEn: string; limitationsAm: string;
};

export function createFallbackGuidance(language: GeminiReviewInput["language"]): GeminiReviewGuidance {
  const guidance: GeminiReviewGuidance = {
    source: "fallback",
    overviewEn: "Gemini guidance is unavailable. The reviewer-supplied comparisons and the browser-calculated range remain available for manual review.",
    overviewAm: "የGemini መመሪያ አሁን አይገኝም። በገምጋሚው የቀረቡ ማነጻጸሪያዎችና በአሳሹ የተሰላው የዋጋ ክልል ለሰው ግምገማ ይገኛሉ።",
    questionsEn: ["Which source documents explain the price, timing, and number of bids?", "Are the comparison records genuinely similar in quantity, specification, and date?", "What additional context should an authorized reviewer verify before recording a conclusion?"],
    questionsAm: ["ዋጋውን፣ የውል ጊዜውን እና የቀረቡ ጨረታዎችን ብዛት የሚያብራሩት የትኞቹ የግዥ መነሻ ሰነዶች ናቸው?", "የማነጻጸሪያ መረጃዎቹ በብዛት፣ በዝርዝር መግለጫ እና በግዥ ወቅት ተመሳሳይ መሆናቸው ተረጋግጧል?", "ፈቃድ ያለው ገምጋሚ የመጨረሻ ማጠቃለያ ከመመዝገቡ በፊት ምን ተጨማሪ ዐውድ ማረጋገጥ አለበት?"],
    limitationsEn: "This fallback does not evaluate fairness, wrongdoing, compliance, or real-world market conditions and does not recommend an action.",
    limitationsAm: "ይህ ተተኪ መመሪያ ፍትሃዊነትን፣ ጥፋትን፣ ህጋዊ ተገዢነትን ወይም የእውነተኛውን ገበያ ሁኔታ አይገመግምም፤ ምንም ዓይነት ውሳኔም አይመክርም።",
  };
  if (language === "am") return { ...guidance, overviewEn: "", questionsEn: [], limitationsEn: "" };
  if (language === "en") return { ...guidance, overviewAm: "", questionsAm: [], limitationsAm: "" };
  return guidance;
}

export async function requestGeminiGuidance(input: GeminiReviewInput): Promise<GeminiReviewGuidance> {
  const response = await fetch("/api/gemini-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (!response.ok) throw new Error("Gemini review guidance is unavailable");
  const result = await response.json() as Omit<GeminiReviewGuidance, "source">;
  return { ...result, source: "gemini" };
}
