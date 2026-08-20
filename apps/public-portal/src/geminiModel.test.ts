import { describe, expect, it } from "vitest";
import { GEMINI_MODEL_NAME, GEMINI_REQUEST_TIMEOUT_MS } from "./geminiModel";

describe("Gemini model configuration", () => {
  it("uses a supported model with a bounded request timeout", () => {
    expect(GEMINI_MODEL_NAME).toBe("gemini-3.6-flash");
    expect(GEMINI_REQUEST_TIMEOUT_MS).toBe(60_000);
  });
});
