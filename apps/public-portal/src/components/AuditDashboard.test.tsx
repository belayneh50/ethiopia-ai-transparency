import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { FaydaContext, maskFin } from "../FaydaContext";
import { AuditDashboard, AuditSignOff } from "./AuditDashboard";
import type { FaydaContextValue } from "../FaydaContext";
import type { RecordItem } from "../types";

const record: RecordItem = {
  id: "SYN-ET-2401",
  item: "Laptop computers (25)",
  itemAm: "ላፕቶፕ ኮምፒውተሮች (25)",
  category: "Technology",
  categoryAm: "ቴክኖሎጂ",
  buyer: "Sample Education Office",
  supplier: "Abay Sample Trading",
  value: 1785000,
  date: "18 Jul 2026",
  status: "Pending approval",
  statusAm: "ፈቃድ በመጠበቅ ላይ",
  daysOpen: 42,
  bids: 4,
  signals: ["price", "delay"],
};

const verified = {
  subjectId: "demo-representative",
  userId: "user-1",
  fullName: "Sara Alemu",
  address: "Adama, Oromia",
  verifiedAt: "2026-09-05T10:00:00.000Z",
  expiresAt: "2026-09-05T10:05:00.000Z",
};

function faydaValue(verification: typeof verified | null): FaydaContextValue {
  return {
    verification,
    verify: async () => ({ ok: false, code: "fin_not_found" as const, message: "" }),
    clearVerification: () => undefined,
  };
}

function wrap(verification: typeof verified | null, node: ReactNode) {
  return renderToStaticMarkup(
    <FaydaContext.Provider value={faydaValue(verification)}>{node}</FaydaContext.Provider>,
  );
}

describe("maskFin", () => {
  it("never exposes a national ID — it shows the non-sensitive demo reference", () => {
    expect(maskFin("demo-representative")).toBe("DEMO");
  });
});

describe("AuditDashboard", () => {
  it("offers a real record picker and a run action, without an audit result until requested", () => {
    const html = wrap(null, <AuditDashboard language="en" records={[record]} onOpenFayda={() => undefined} />);
    expect(html).toContain("Laptop computers (25)");
    expect(html).toContain(`value="${record.id}"`);
    expect(html).toContain("Run AI audit");
    expect(html).not.toContain("Transparency score");
  });

  it("shows the Fayda gate when unverified, next to the run action", () => {
    const html = wrap(null, <AuditDashboard language="en" records={[record]} onOpenFayda={() => undefined} />);
    expect(html).toContain("Sign-off gated");
    expect(html).toContain("Verify with Fayda");
  });

  it("shows the sign-off identity when verified", () => {
    const html = wrap(verified, <AuditDashboard language="en" records={[record]} onOpenFayda={() => undefined} />);
    expect(html).toContain("Sign-off identity");
    expect(html).toContain("Sara Alemu");
    expect(html).toContain("DEMO");
    expect(html).not.toContain("Sign-off gated");
  });

  it("renders the Amharic copy when the language is Amharic", () => {
    const html = wrap(null, <AuditDashboard language="am" records={[record]} onOpenFayda={() => undefined} />);
    expect(html).toContain("AI ኦዲት አሂድ");
    expect(html).toContain("መዝገብ");
  });

  it("shows an empty state when there are no records", () => {
    const html = wrap(null, <AuditDashboard language="en" records={[]} onOpenFayda={() => undefined} />);
    expect(html).toContain("No records to audit.");
  });
});

describe("AuditSignOff", () => {
  it("renders the signed-off stamp with verifier identity and date when verified and signed", () => {
    const html = renderToStaticMarkup(
      <AuditSignOff
        language="en"
        verification={verified}
        signedOffAt="2026-09-05T10:00:00.000Z"
        onOpenFayda={() => undefined}
        onSignOffNow={() => undefined}
      />,
    );
    expect(html).toContain("Signed off by");
    expect(html).toContain("Sara Alemu");
    expect(html).toContain("DEMO");
    expect(html).toContain("Sep");
    expect(html).toContain("2026");
  });

  it("offers the sign-off action when verified but not yet signed", () => {
    const html = renderToStaticMarkup(
      <AuditSignOff
        language="en"
        verification={verified}
        signedOffAt={null}
        onOpenFayda={() => undefined}
        onSignOffNow={() => undefined}
      />,
    );
    expect(html).toContain("Sign off this audit report");
    expect(html).not.toContain("Signed off by");
  });

  it("shows the verify gate when unverified — no stamp is possible", () => {
    const html = renderToStaticMarkup(
      <AuditSignOff
        language="en"
        verification={null}
        signedOffAt={null}
        onOpenFayda={() => undefined}
        onSignOffNow={() => undefined}
      />,
    );
    expect(html).toContain("Verify Fayda ID to sign off on this audit report");
    expect(html).toContain("Verify with Fayda");
    expect(html).not.toContain("Signed off by");
  });
});