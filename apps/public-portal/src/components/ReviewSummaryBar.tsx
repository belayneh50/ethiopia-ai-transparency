import { Dual } from "./Dual";
import { REVIEW_FILTER_OPTIONS, matchesReviewFilter, type ReviewFilter } from "../reviewFilter";
import type { Language, RecordItem } from "../types";

type ReviewSummaryBarProps = {
  records: RecordItem[];
  reviewFilter: ReviewFilter;
  language: Language;
  onSelectReviewFilter: (filter: ReviewFilter) => void;
  onResetReviews: () => void;
};

export function ReviewSummaryBar({
  records,
  reviewFilter,
  language,
  onSelectReviewFilter,
  onResetReviews,
}: ReviewSummaryBarProps) {
  const fieldText = (en: string, am: string) =>
    language === "am" ? am : language === "en" ? en : `${en} · ${am}`;

  return (
    <div
      className="review-summary-bar"
      aria-label={fieldText("Human Review summary", "የሰው ግምገማ ማጠቃለያ")}
    >
      <span className="rsb-title">
        <Dual en="Human review" am="የሰው ግምገማ" />
      </span>

      {REVIEW_FILTER_OPTIONS.filter((option) => option.value !== "all").map((option) => {
        const count = records.filter((record) =>
          matchesReviewFilter(record, option.value)
        ).length;
        const isActive = reviewFilter === option.value;
        return (
          <button
            key={option.value}
            className={`rsb-item rsb-clickable ${isActive ? "active" : ""}`}
            onClick={() => onSelectReviewFilter(isActive ? "all" : option.value)}
            aria-pressed={isActive}
          >
            <b>{count}</b>
            <span className="rsb-label">
              <Dual en={option.en} am={option.am} separator=" / " />
            </span>
          </button>
        );
      })}

      {reviewFilter !== "all" && (
        <button className="rsb-clear-filter" onClick={() => onSelectReviewFilter("all")}>
          <Dual en="Clear filter" am="ማጣሪያ አጽዳ" separator="" />
        </button>
      )}

      {records.some((record) => record.reviewStatus && record.reviewStatus !== "pending") && (
        <button className="reset-reviews-btn" onClick={onResetReviews}>
          <Dual en="Reset local reviews" am="የአካባቢ ግምገማዎችን አጽዳ" separator="" />
        </button>
      )}

      <span className="rsb-note">
        ⓘ <Dual en="Local-only — this session's synthetic records." am="የአካባቢ ብቻ — በዚህ ክፍለ ጊዜ የተመዘገቡ የሙከራ መረጃዎች።" separator="" />
      </span>
    </div>
  );
}
