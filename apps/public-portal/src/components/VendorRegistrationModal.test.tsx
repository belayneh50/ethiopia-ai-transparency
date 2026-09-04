import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FaydaContext } from "../FaydaContext";
import { VendorRegistrationModal } from "./VendorRegistrationModal";
import type { FaydaContextValue } from "../FaydaContext";

const faydaValue: FaydaContextValue = {
  verification: null,
  verify: async () => ({ ok: false, code: "fin_not_found" as const, message: "" }),
  clearVerification: () => undefined,
};

function render(language: "both" | "am" | "en") {
  return renderToStaticMarkup(
    <FaydaContext.Provider value={faydaValue}>
      <VendorRegistrationModal language={language} onClose={() => undefined} />
    </FaydaContext.Provider>,
  );
}

describe("VendorRegistrationModal", () => {
  it("renders the verification step and honest labels, with registration locked until verified", () => {
    const html = render("en");
    expect(html).toContain('role="dialog"');
    expect(html).toContain("Vendor registration (Fayda-gated)");
    expect(html).toContain("Step 1 — Verify the representative");
    expect(html).toContain("Verify with Fayda");
    // Company field and register action are disabled until the identity is verified.
    expect(html).toContain("disabled:bg-[#f2f3f0]"); // the disabled styling is on the company input only
    expect(html).toContain('disabled=""');
    expect(html).toContain("Register vendor");
    expect(html).toContain("Simulated only — no real NIDP check, credential, or bid is produced");
    // No registration outcome before any action.
    expect(html).not.toContain("Vendor registered");
  });

  it("renders the Amharic copy in Amharic mode", () => {
    const html = render("am");
    expect(html).toContain("የአቅራቢ ምዝገባ");
    expect(html).toContain("በፋይዳ አረጋግጥ");
    expect(html).toContain("አቅራቢ ይመዝገብ");
  });
});