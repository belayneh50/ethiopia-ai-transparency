import { describe, expect, it } from "vitest";
import {
  adaptNeutralGuidance,
  adaptGeminiPayload,
  extractGeneratedTexts,
} from "./geminiResponseAdapter";

describe("adaptNeutralGuidance", () => {
  const validBothJson = JSON.stringify({
    overviewEn: "Review the attached specification documents and delivery logs.",
    overviewAm: "የተያያዙትን የዝርዝር መግለጫ ሰነዶችና የማስረከቢያ መዝገቦችን ይገምግሙ።",
    questionsEn: [
      "Are all items verified against delivery notes?",
      "Was the unit price comparable to standard public framework agreements?",
    ],
    questionsAm: [
      "ሁሉም ዕቃዎች ከማስረከቢያ ማስታወሻዎች ጋር ተረጋግጠዋል?",
      "የአንዱ ዋጋ ከመደበኛ የመንግሥት የውል ማዕቀፎች ጋር ተመጣጣኝ ነበር?",
    ],
    limitationsEn: "This guidance does not establish compliance or wrongdoing.",
    limitationsAm: "ይህ መመሪያ ተገዢነትን ወይም ጥፋትን አያረጋግጥም።",
  });

  it("adapts valid bilingual guidance correctly", () => {
    const result = adaptNeutralGuidance(validBothJson, "both");
    expect(result.overviewEn).toContain("Review the attached");
    expect(result.overviewAm).toContain("የተያያዙትን");
    expect(result.questionsEn).toHaveLength(2);
    expect(result.questionsAm).toHaveLength(2);
  });

  it("rejects guidance containing prohibited accusatory language", () => {
    const prohibitedJson = JSON.stringify({
      overviewEn: "This record indicates wrongdoing and should reject immediately.",
      overviewAm: "ይህ መዝገብ ጥፋትን ያሳያል።",
      questionsEn: ["Why is this vendor corrupt?", "What penalty should apply?"],
      questionsAm: ["ይህ አቅራቢ ለምን ሙስና ሠራ?", "ምን ቅጣት መተግበር አለበት?"],
      limitationsEn: "None.",
      limitationsAm: "ምንም።",
    });

    expect(() => adaptNeutralGuidance(prohibitedJson, "both")).toThrow(
      "response_contract"
    );
  });

  it("rejects guidance with risk scores", () => {
    const riskScoreJson = JSON.stringify({
      overviewEn: "High risk score assigned to this contract.",
      overviewAm: "ለዚህ ውል ከፍተኛ የአደጋ ነጥብ ተሰጥቷል።",
      questionsEn: ["Is the risk rating verified?", "Can we re-evaluate?"],
      questionsAm: ["የአደጋ ደረጃው ተረጋግጧል?", "እንደገና መገምገም እንችላለን?"],
      limitationsEn: "Neutral.",
      limitationsAm: "ገለልተኛ።",
    });

    expect(() => adaptNeutralGuidance(riskScoreJson, "both")).toThrow(
      "response_contract"
    );
  });
});

describe("adaptGeminiPayload", () => {
  it("extracts and parses valid candidate payloads with markdown fences", () => {
    const payload = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: '```json\n{"overviewEn":"Neutral context.","overviewAm":"ገለልተኛ ዐውድ።","questionsEn":["Q1?","Q2?"],"questionsAm":["ጥ1?","ጥ2?"],"limitationsEn":"Limitation text.","limitationsAm":"የገደብ ጽሑፍ።"}\n```',
              },
            ],
          },
        },
      ],
    };

    const texts = extractGeneratedTexts(payload);
    expect(texts).toHaveLength(1);

    const guidance = adaptGeminiPayload(payload, "both");
    expect(guidance.overviewEn).toBe("Neutral context.");
    expect(guidance.questionsEn).toEqual(["Q1?", "Q2?"]);
  });
});
