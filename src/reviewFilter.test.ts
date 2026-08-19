import { describe, expect, it } from "vitest";
import {
  matchesReviewFilter,
  REVIEW_STATUSES,
  type FilterableRecord,
} from "./reviewFilter";

describe("matchesReviewFilter", () => {
  const pendingRecord: FilterableRecord = { reviewStatus: "pending" };
  const unreviewedRecord: FilterableRecord = {};
  const underReviewRecord: FilterableRecord = {
    reviewStatus: "under-review",
    reviewNote: "Checking invoice",
  };
  const referredRecord: FilterableRecord = { reviewStatus: "referred" };
  const noConcernRecord: FilterableRecord = { reviewStatus: "no-concern" };
  const needsDocsRecord: FilterableRecord = { reviewStatus: "needs-docs" };

  it("matches 'all' filter for every record", () => {
    expect(matchesReviewFilter(pendingRecord, "all")).toBe(true);
    expect(matchesReviewFilter(unreviewedRecord, "all")).toBe(true);
    expect(matchesReviewFilter(underReviewRecord, "all")).toBe(true);
    expect(matchesReviewFilter(referredRecord, "all")).toBe(true);
  });

  it("matches 'not-reviewed' filter for pending or unassigned records", () => {
    expect(matchesReviewFilter(pendingRecord, "not-reviewed")).toBe(true);
    expect(matchesReviewFilter(unreviewedRecord, "not-reviewed")).toBe(true);
    expect(matchesReviewFilter(underReviewRecord, "not-reviewed")).toBe(false);
    expect(matchesReviewFilter(noConcernRecord, "not-reviewed")).toBe(false);
  });

  it("matches specific review status filters", () => {
    expect(matchesReviewFilter(underReviewRecord, "under-review")).toBe(true);
    expect(matchesReviewFilter(underReviewRecord, "needs-docs")).toBe(false);
    expect(matchesReviewFilter(needsDocsRecord, "needs-docs")).toBe(true);
    expect(matchesReviewFilter(referredRecord, "referred")).toBe(true);
    expect(matchesReviewFilter(noConcernRecord, "no-concern")).toBe(true);
  });

  it("provides bilingual translations for all review statuses", () => {
    expect(REVIEW_STATUSES["pending"].en).toBe("Pending review");
    expect(REVIEW_STATUSES["pending"].am).toBe("ግምገማ በመጠበቅ ላይ");
    expect(REVIEW_STATUSES["no-concern"].en).toBe("No concern identified");
    expect(REVIEW_STATUSES["no-concern"].am).toBe("ምንም ስጋት አልተገኘም");
  });
});
