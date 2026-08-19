export type ReviewStatus = "pending" | "needs-docs" | "under-review" | "no-concern" | "referred";

export type ReviewFilter = "all" | "not-reviewed" | Exclude<ReviewStatus, "pending">;

export type FilterableRecord = {
  reviewStatus?: ReviewStatus;
  reviewNote?: string;
  reviewDate?: string;
};

export function matchesReviewFilter(record: FilterableRecord, filter: ReviewFilter): boolean {
  if (filter === "all") return true;
  if (filter === "not-reviewed") return !record.reviewStatus || record.reviewStatus === "pending";
  return record.reviewStatus === filter;
}

export const REVIEW_STATUSES: Record<ReviewStatus, { en: string; am: string }> = {
  pending: { en: "Pending review", am: "ግምገማ በመጠበቅ ላይ" },
  "needs-docs": { en: "Needs supporting documents", am: "ተጨማሪ ሰነዶች ያስፈልጋሉ" },
  "under-review": { en: "Under review", am: "በግምገማ ላይ" },
  "no-concern": { en: "No concern identified", am: "ምንም ስጋት አልተገኘም" },
  referred: { en: "Referred for further review", am: "ለተጨማሪ ግምገማ ተልኳል" },
};

export const REVIEW_FILTER_OPTIONS: { value: ReviewFilter; en: string; am: string }[] = [
  { value: "all", en: "All review states", am: "ሁሉም የግምገማ ሁኔታዎች" },
  { value: "not-reviewed", en: "Not yet reviewed", am: "ገና አልተገመገመም" },
  { value: "needs-docs", en: "Needs documents", am: "ተጨማሪ ሰነድ የሚፈለግ" },
  { value: "under-review", en: "Under review", am: "በግምገማ ላይ" },
  { value: "no-concern", en: "No concern", am: "ስጋት የሌለው" },
  { value: "referred", en: "Referred", am: "ተልኳል" },
];
