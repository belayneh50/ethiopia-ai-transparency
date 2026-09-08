import { describe, expect, it, vi } from "vitest";
vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ can: () => true }) }));
import { renderToStaticMarkup } from "react-dom/server";
import { FaydaContext } from "../FaydaContext";
import { HumanReviewPanel } from "./HumanReviewPanel";
import type { FaydaContextValue } from "../FaydaContext";
import type { RecordItem } from "../types";
import type { FaydaVerification } from "../faydaStorage";

const verified: FaydaVerification = {
  subjectId: "demo-representative",
  userId: "user-1",
  fullName: "Sara Alemu",
  address: "Adama, Oromia",
  verifiedAt: "2026-09-05T10:00:00.000Z",
  expiresAt: "2026-09-05T10:05:00.000Z",
};

function faydaValue(verification: FaydaVerification | null): FaydaContextValue {
  return {
    verification,
    verify: async () => ({ ok: false, code: "fin_not_found" as const, message: "" }),
    clearVerification: () => undefined,
  };
}

const baseRecord: RecordItem = {
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
  reviewStatus: "no-concern",
  reviewNote: "Checked the source documents.",
  reviewDate: "05 Sep 2026",
};

function render(verification: FaydaVerification | null, record: RecordItem = baseRecord) {
  return renderToStaticMarkup(
    <FaydaContext.Provider value={faydaValue(verification)}>
      <HumanReviewPanel
        record={record}
        language="en"
        onSaveReview={() => undefined}
        onOpenFayda={() => undefined}
      />
    </FaydaContext.Provider>,
  );
}

describe("HumanReviewPanel — Fayda sign-off gate", () => {
  it("disables the save action and shows the verify gate when unverified", () => {
    const html = render(null);
    expect(html).toContain("Fayda eKYC verification is required to sign off a review");
    expect(html).toContain("Verify with Fayda");
    // disabled={true} renders as disabled=""
    expect(html).toContain('class="save-review" disabled=""');
  });

  it("enables the save action when the reviewer is Fayda-verified", () => {
    const html = render(verified);
    expect(html).not.toContain("Fayda eKYC verification is required");
    expect(html).not.toContain('class="save-review" disabled=""');
    expect(html).toContain("Save local review");
  });

  it("shows the recorded assessment with the sign-off identity, never a national ID", () => {
    const record: RecordItem = {
      ...baseRecord,
      reviewSignedBy: { name: "Sara Alemu", subjectId: "demo-representative" },
    };
    const html = render(null, record);
    expect(html).toContain("RECORDED ASSESSMENT");
    expect(html).toContain("Signed by Sara Alemu (sign-off DEMO)");
    expect(html).not.toContain("123456789012");
  });
});
