import { describe, expect, it } from "vitest";
import {
  adaptTransparencyAuditText,
  clampTransparencyScore,
  composeGeminiAuditPayload,
  createTransparencyAuditFallback,
  type TransparencyAuditInput,
} from "./geminiService";

const englishBody = (overrides: Record<string, unknown> = {}) => JSON.stringify({
  transparencyScore: 72,
  identifiedBottlenecksEn: ["The record lacks source-document fields.", "Only one bid was recorded."],
  recommendationsEn: ["Attach the underlying source documents.", "Compare against same-category records."],
  ...overrides,
});

const amharicBody = () => JSON.stringify({
  transparencyScore: 41,
  identifiedBottlenecksAm: ["የመነሻ ሰነዶች አልተመዘገቡም።"],
  recommendationsAm: ["ሰነዶቹን አያይዝ።"],
});

const bilingualBody = () => JSON.stringify({
  transparencyScore: 88,
  identifiedBottlenecksEn: ["A single source was recorded."],
  identifiedBottlenecksAm: ["አንድ ምንጭ ብቻ ተመዝግቧል።"],
  recommendationsEn: ["Verify the recorded source."],
  recommendationsAm: ["የተመዘገበውን ምንጭ አረጋግጥ።"],
});

const baseInput = (overrides: Partial<TransparencyAuditInput> = {}): TransparencyAuditInput => ({
  language: "en",
  id: "SYN-ET-0001",
  item: "Laptop computers",
  category: "IT Equipment",
  buyer: "Ministry of Example",
  supplier: "Example Trading PLC",
  value: 4800000,
  date: "2026-03-14",
  status: "open",
  daysOpen: 32,
  bids: 3,
  signals: [],
  ...overrides,
});

describe("adaptTransparencyAuditText", () => {
  it("accepts a valid English audit and keeps Amharic arrays empty", () => {
    const result = adaptTransparencyAuditText(englishBody(), "en");
    expect(result.transparencyScore).toBe(72);
    expect(result.identifiedBottlenecksEn).toHaveLength(2);
    expect(result.recommendationsEn).toHaveLength(2);
    expect(result.identifiedBottlenecksAm).toEqual([]);
    expect(result.recommendationsAm).toEqual([]);
  });

  it("accepts a valid Amharic audit and keeps English arrays empty", () => {
    const result = adaptTransparencyAuditText(amharicBody(), "am");
    expect(result.transparencyScore).toBe(41);
    expect(result.identifiedBottlenecksAm).toHaveLength(1);
    expect(result.identifiedBottlenecksEn).toEqual([]);
  });

  it("accepts a bilingual audit and validates both languages", () => {
    const result = adaptTransparencyAuditText(bilingualBody(), "both");
    expect(result.transparencyScore).toBe(88);
    expect(result.identifiedBottlenecksEn).toHaveLength(1);
    expect(result.identifiedBottlenecksAm).toHaveLength(1);
    expect(result.recommendationsEn).toHaveLength(1);
    expect(result.recommendationsAm).toHaveLength(1);
  });

  it("rejects a missing required array for the requested language", () => {
    expect(() => adaptTransparencyAuditText(englishBody({ recommendationsEn: [] }), "en")).toThrow("response_contract");
    expect(() => adaptTransparencyAuditText(englishBody({ identifiedBottlenecksEn: undefined }), "en")).toThrow("response_contract");
  });

  it("rejects a non-numeric score", () => {
    expect(() => adaptTransparencyAuditText(englishBody({ transparencyScore: "72" }), "en")).toThrow("response_contract");
  });

  it("clamps an out-of-range numeric score instead of failing", () => {
    expect(adaptTransparencyAuditText(englishBody({ transparencyScore: 143 }), "en").transparencyScore).toBe(100);
    expect(adaptTransparencyAuditText(englishBody({ transparencyScore: -9 }), "en").transparencyScore).toBe(0);
  });

  it("rejects a score nested in fenced code only when the object is malformed", () => {
    expect(adaptTransparencyAuditText(`\`\`\`json\n${englishBody()}\n\`\`\``, "en").transparencyScore).toBe(72);
    expect(() => adaptTransparencyAuditText("not json at all", "en")).toThrow("response_contract");
  });
});

describe("clampTransparencyScore", () => {
  it("bounds any value to the integer range 0-100", () => {
    expect(clampTransparencyScore(10.6)).toBe(11);
    expect(clampTransparencyScore(200)).toBe(100);
    expect(clampTransparencyScore(-5)).toBe(0);
    expect(clampTransparencyScore(Number.NaN)).toBe(50);
  });
});

describe("createTransparencyAuditFallback", () => {
  it("returns a valid 0-100 score derived from observable signals", () => {
    const quiet = createTransparencyAuditFallback(baseInput());
    expect(quiet.source).toBe("fallback");
    expect(quiet.transparencyScore).toBeGreaterThanOrEqual(0);
    expect(quiet.transparencyScore).toBeLessThanOrEqual(100);
    const flagged = createTransparencyAuditFallback(baseInput({ signals: ["value-outlier", "single-bid", "late-delivery"], daysOpen: 120, bids: 1 }));
    expect(flagged.transparencyScore).toBeLessThan(quiet.transparencyScore);
  });

  it("shapes output arrays to the requested language", () => {
    const am = createTransparencyAuditFallback(baseInput({ language: "am" }));
    expect(am.identifiedBottlenecksAm.length).toBeGreaterThan(0);
    expect(am.identifiedBottlenecksEn).toEqual([]);
    const en = createTransparencyAuditFallback(baseInput({ language: "en" }));
    expect(en.identifiedBottlenecksEn.length).toBeGreaterThan(0);
    expect(en.identifiedBottlenecksAm).toEqual([]);
    const both = createTransparencyAuditFallback(baseInput({ language: "both" }));
    expect(both.identifiedBottlenecksEn.length).toBeGreaterThan(0);
    expect(both.identifiedBottlenecksAm.length).toBeGreaterThan(0);
  });
});

describe("composeGeminiAuditPayload", () => {
  it("enforces the transparencyScore + language-scoped arrays in the responseSchema", () => {
    const en = composeGeminiAuditPayload(baseInput()) as { generationConfig: { responseSchema: { properties: Record<string, unknown>; required: string[] } } };
    expect(en.generationConfig.responseSchema.properties.transparencyScore).toBeTruthy();
    expect(en.generationConfig.responseSchema.required).toEqual(["transparencyScore", "identifiedBottlenecksEn", "recommendationsEn"]);

    const both = composeGeminiAuditPayload(baseInput({ language: "both" })) as { generationConfig: { responseSchema: { required: string[] } } };
    expect(both.generationConfig.responseSchema.required).toEqual([
      "transparencyScore", "identifiedBottlenecksEn", "recommendationsEn", "identifiedBottlenecksAm", "recommendationsAm",
    ]);
  });
});
