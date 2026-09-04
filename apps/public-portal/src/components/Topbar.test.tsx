import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthContext } from "../auth/AuthContext";
import { FaydaContext } from "../FaydaContext";
import { Topbar } from "./Topbar";
import type { AuthContextValue } from "../auth/AuthContext";
import type { FaydaContextValue } from "../FaydaContext";

const authValue: AuthContextValue = {
  user: { id: "1", email: "admin.demo@clearprocurement.et", name: "Admin Demo", role: "admin" },
  token: "t",
  role: "admin",
  isAuthenticated: true,
  login: async () => ({ ok: true }),
  logout: () => undefined,
  can: () => true,
};

const verified = {
  fin: "123456789012",
  fullName: "Sara Alemu",
  address: "Adama, Oromia",
  verifiedAt: "2026-09-05T10:00:00.000Z",
};

function faydaValue(verification: typeof verified | null): FaydaContextValue {
  return {
    verification,
    verify: async () => ({ ok: false, code: "fin_not_found" as const, message: "" }),
    clearVerification: () => undefined,
  };
}

function render(verification: typeof verified | null) {
  return renderToStaticMarkup(
    <AuthContext.Provider value={authValue}>
      <FaydaContext.Provider value={faydaValue(verification)}>
        <Topbar
          language="en"
          onLanguageChange={() => undefined}
          onOpenExportModal={() => undefined}
          onOpenSettingsModal={() => undefined}
          onOpenFaydaModal={() => undefined}
          onOpenVendorModal={() => undefined}
        />
      </FaydaContext.Provider>
    </AuthContext.Provider>,
  );
}

describe("Topbar — Fayda status chip", () => {
  it("shows an unverified chip when the session has no verified identity", () => {
    const html = render(null);
    expect(html).toContain("eKYC: Unverified");
    expect(html).not.toContain("eKYC ✓");
  });

  it("shows the verified identity's first name once verified", () => {
    const html = render(verified);
    expect(html).toContain("eKYC ✓ Sara");
    expect(html).not.toContain("eKYC: Unverified");
  });

  it("always offers the vendor registration entry point", () => {
    const html = render(null);
    expect(html).toContain("Vendor reg");
  });
});