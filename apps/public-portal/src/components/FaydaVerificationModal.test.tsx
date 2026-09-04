import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FaydaOutcome, FaydaVerificationModal, faydaErrorMessage } from "./FaydaVerificationModal";
import { FAYDA_DEMO_VERIFIED_FIN } from "../services/faydaService";
import { FaydaContext } from "../FaydaContext";
import type { FaydaAuthenticationResult } from "../services/faydaService";
import type { FaydaContextValue } from "../FaydaContext";

const faydaValue: FaydaContextValue = {
  verification: null,
  verify: async () => ({ ok: false, code: "fin_not_found" as const, message: "" }),
  clearVerification: () => undefined,
};

const renderModal = (language: "both" | "am") =>
  renderToStaticMarkup(
    <FaydaContext.Provider value={faydaValue}>
      <FaydaVerificationModal language={language} onClose={() => undefined} />
    </FaydaContext.Provider>,
  );

const verifiedResult: FaydaAuthenticationResult = {
  ok: true,
  idToken: "a.b.",
  expiresInSeconds: 300,
  minimalData: { fullName: "Hanna Tadesse", address: "Addis Ababa, Bole Sub-city", biometricVerified: true },
};

describe("faydaErrorMessage", () => {
  it("maps every rejection code to a bilingual, usable message", () => {
    expect(faydaErrorMessage("invalid_fin").en).toContain("12 digits");
    expect(faydaErrorMessage("invalid_fin").am.length).toBeGreaterThan(0);
    expect(faydaErrorMessage("fin_not_found").en).toContain("No registered identity");
    expect(faydaErrorMessage("fin_not_found").am.length).toBeGreaterThan(0);
    expect(faydaErrorMessage("nidp_unavailable").en).toContain("temporarily unavailable");
    expect(faydaErrorMessage("nidp_unavailable").am.length).toBeGreaterThan(0);
  });
});

describe("FaydaOutcome", () => {
  it("renders verified minimal data (name, address, biometric) bilingually", () => {
    const html = renderToStaticMarkup(<FaydaOutcome language="both" result={verifiedResult} />);
    expect(html).toContain("Identity verified");
    expect(html).toContain("ማንነት ተረጋግጧል");
    expect(html).toContain("Hanna Tadesse");
    expect(html).toContain("Addis Ababa, Bole Sub-city");
    expect(html).toContain("Matched");
    expect(html).toContain("ተጣጥሟል");
  });

  it("shows the typed rejection message for an unregistered FIN", () => {
    const rejected: FaydaAuthenticationResult = { ok: false, code: "fin_not_found", message: "" };
    const html = renderToStaticMarkup(<FaydaOutcome language="en" result={rejected} />);
    expect(html).toContain("Verification failed");
    expect(html).toContain("No registered identity");
  });

  it("drops Amharic content entirely in English mode", () => {
    const html = renderToStaticMarkup(<FaydaOutcome language="en" result={verifiedResult} />);
    expect(html).not.toContain("ማንነት ተረጋግጧል");
    expect(html).not.toContain("ተጣጥሟል");
  });
});

describe("FaydaVerificationModal", () => {
  it("renders an idle form with FIN input, verify action, demo hints, and the mock disclaimer", () => {
    const html = renderModal("both");
    expect(html).toContain('role="dialog"');
    expect(html).toContain("Verify with Fayda");
    expect(html).toContain("በፋይዳ አረጋግጥ");
    expect(html).toContain("input");
    expect(html).toContain(FAYDA_DEMO_VERIFIED_FIN);
    expect(html).toContain("991234567890");
    expect(html).toContain("Simulated mock only");
    // No verification outcome before submission.
    expect(html).not.toContain("Identity verified");
  });

  it("renders the Amharic action label in Amharic mode", () => {
    const html = renderModal("am");
    expect(html).toContain("በፋይዳ አረጋግጥ");
    expect(html).not.toContain("Verify with Fayda");
  });
});
