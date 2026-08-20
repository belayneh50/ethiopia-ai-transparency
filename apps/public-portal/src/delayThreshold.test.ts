import { describe, expect, it } from "vitest";
import { getDelayThresholdCopy } from "./delayThreshold";

describe("getDelayThresholdCopy", () => {
  it("uses the configured delay threshold in both languages", () => {
    expect(getDelayThresholdCopy(42, 30)).toEqual({
      en: "This procurement has been active for 42 days without final resolution, exceeding the 30-day review threshold.",
      am: "ይህ ግዥ የመጨረሻ ውሳኔ ሳያገኝ 42 ቀናት የቆየ ሲሆን፣ ይህም ከ30 ቀናት የማሳያ ገደብ በላይ ነው።",
    });
  });
});
