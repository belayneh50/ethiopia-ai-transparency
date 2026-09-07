export type GuidanceLanguage = "am" | "en" | "both";

export type NeutralGuidance = {
  overviewEn: string; overviewAm: string;
  questionsEn: string[]; questionsAm: string[];
  limitationsEn: string; limitationsAm: string;
};

type GeminiPayload = { candidates?: Array<{ content?: { parts?: Array<Record<string, unknown>> } }> };

export function describeGeminiShape(payload: GeminiPayload) {
  const candidate = payload.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  return { rootFields: Object.keys(payload), candidateFields: candidate ? Object.keys(candidate) : [], finishReason: candidate && "finishReason" in candidate ? candidate.finishReason : undefined, contentFields: candidate?.content ? Object.keys(candidate.content) : [], partFields: parts.map(part => Object.keys(part)) };
}

export function extractGeneratedText(payload: GeminiPayload): string | null {
  const texts = extractGeneratedTexts(payload);
  return texts.length ? texts.join("\n") : null;
}

export function extractGeneratedTexts(payload: GeminiPayload): string[] {
  return (payload.candidates?.[0]?.content?.parts || []).map(part => part.text).filter((value): value is string => typeof value === "string");
}

function parseGeneratedObject(text: string): Record<string, unknown> {
  const unfenced = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("response_contract");
  return JSON.parse(unfenced.slice(start, end + 1)) as Record<string, unknown>;
}

export function describeGeneratedGuidance(text: string) {
  try {
    const parsed = parseGeneratedObject(text);
    return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, { type: Array.isArray(value) ? "array" : typeof value, length: typeof value === "string" || Array.isArray(value) ? value.length : null }]));
  } catch { return { parseable: false }; }
}

export function adaptNeutralGuidance(text: string, language: GuidanceLanguage): NeutralGuidance {
  const parsed = parseGeneratedObject(text);
  const stringValue = (key: string) => typeof parsed[key] === "string" ? parsed[key] as string : "";
  const stringArray = (key: string) => Array.isArray(parsed[key]) && (parsed[key] as unknown[]).every(value => typeof value === "string") ? parsed[key] as string[] : [];
  const result: NeutralGuidance = { overviewEn: stringValue("overviewEn"), overviewAm: stringValue("overviewAm"), questionsEn: stringArray("questionsEn"), questionsAm: stringArray("questionsAm"), limitationsEn: stringValue("limitationsEn"), limitationsAm: stringValue("limitationsAm") };
  const strings = [result.overviewEn, result.overviewAm, result.limitationsEn, result.limitationsAm];
  const shapeValid = language === "am" ? !result.overviewEn && !result.limitationsEn && !result.questionsEn.length && !!result.overviewAm && result.questionsAm.length >= 2 && result.questionsAm.length <= 4 && !!result.limitationsAm : language === "en" ? !result.overviewAm && !result.limitationsAm && !result.questionsAm.length && !!result.overviewEn && result.questionsEn.length >= 2 && result.questionsEn.length <= 4 && !!result.limitationsEn : !!result.overviewEn && !!result.overviewAm && result.questionsEn.length >= 2 && result.questionsEn.length <= 4 && result.questionsAm.length === result.questionsEn.length && !!result.limitationsEn && !!result.limitationsAm;
  const serialized = JSON.stringify(result);
  const hasUnsafeRiskScore = serialized
    .split(/[.!?\n]+/)
    .some((sentence) =>
      /risk score|risk rating/i.test(sentence) &&
      !/\b(?:no|not|without|doesn't|does not|will not|won't)\b/i.test(sentence)
    );
  const prohibited = /(?:is|was|appears|seems) corrupt|(?:committed|indicates|shows) wrongdoing|(?:is|was) guilty|(?:is|was) biased|fairness determination|(?:we|i) recommend|recommend(?:s|ed)? (?:that|to)|should (?:reject|approve|investigate|award)|የአደጋ ነጥብ|ሙስና ነው|ጥፋተኛ ነው|አድልዎ አለ|እንዲያጸድቅ|እንዲያስቀር|እንዲመረምር|ማጽደቅ አለበት|ውድቅ ማድረግ አለበት/i;
  if (!shapeValid || strings.some(value => value.length > 1200) || [...result.questionsEn, ...result.questionsAm].some(value => value.length > 500) || hasUnsafeRiskScore || prohibited.test(serialized)) throw new Error("response_contract");
  return result;
}

export function adaptGeminiPayload(payload: GeminiPayload, language: GuidanceLanguage): NeutralGuidance {
  const texts = extractGeneratedTexts(payload);
  const attempts = [...texts].reverse();
  if (texts.length > 1) attempts.push(texts.join("\n"));
  for (const text of attempts) {
    try { return adaptNeutralGuidance(text, language); } catch { /* try the next generated part */ }
  }
  throw new Error("response_contract");
}
