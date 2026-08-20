import { describe, expect, it } from "vitest";
import { resolveRecordQuantity } from "./marketReference";

describe("resolveRecordQuantity", () => {
  it("prefers an explicit record quantity", () => {
    expect(resolveRecordQuantity("Office chairs (50)", 24)).toBe(24);
  });

  it("keeps legacy records working by reading a trailing quantity", () => {
    expect(resolveRecordQuantity("Office chairs (50)")).toBe(50);
  });

  it("rejects invalid explicit quantities instead of guessing", () => {
    expect(resolveRecordQuantity("Office chairs (50)", 0)).toBeNull();
  });
});
