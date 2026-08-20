import { describe, expect, it } from "vitest";
import { adaptNeutralGuidance } from "./geminiResponseAdapter";

const englishGuidance = {
  overviewEn: "The supplied synthetic record contains review signals that require source-document verification.",
  questionsEn: ["Which source documents support the recorded value?", "Was the unit basis verified?"],
  limitationsEn: "This guidance does not provide a risk score or recommendation.",
};

describe("adaptNeutralGuidance", () => {
  it("allows a neutral disclaimer that says no risk score is provided", () => {
    expect(adaptNeutralGuidance(JSON.stringify(englishGuidance), "en").limitationsEn)
      .toBe(englishGuidance.limitationsEn);
  });

  it("rejects an actual risk score", () => {
    expect(() => adaptNeutralGuidance(JSON.stringify({
      ...englishGuidance,
      limitationsEn: "Risk score: 7 out of 10.",
    }), "en")).toThrow("response_contract");
  });
});
