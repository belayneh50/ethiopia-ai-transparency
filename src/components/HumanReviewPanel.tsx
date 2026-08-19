import { useState, useEffect } from "react";
import { Dual } from "./Dual";
import { REVIEW_STATUSES, type ReviewStatus } from "../reviewFilter";
import type { Language, RecordItem } from "../types";

type HumanReviewPanelProps = {
  record: RecordItem;
  language: Language;
  onSaveReview: (recordId: string, status: ReviewStatus, note: string) => void;
};

export function HumanReviewPanel({ record, language, onSaveReview }: HumanReviewPanelProps) {
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(record.reviewStatus ?? "pending");
  const [reviewNote, setReviewNote] = useState<string>(record.reviewNote ?? "");

  useEffect(() => {
    setReviewStatus(record.reviewStatus ?? "pending");
    setReviewNote(record.reviewNote ?? "");
  }, [record.id, record.reviewStatus, record.reviewNote]);

  const fieldText = (en: string, am: string) =>
    language === "am" ? am : language === "en" ? en : `${en} · ${am}`;

  return (
    <section className="human-review-section" aria-labelledby="human-review-title">
      <p className="eyebrow">
        <Dual en="LOCAL-ONLY WORKFLOW" am="የአካባቢ የሥራ ሂደት" separator="" />
      </p>
      <h3 id="human-review-title">
        <Dual en="Human Review" am="የሰው ግምገማ" separator="" />
      </h3>
      <p className="review-intro">
        <Dual
          en="Record an authorized reviewer’s current assessment. This local demo does not make a decision, allegation, or automatic action."
          am="የተፈቀደለትን ገምጋሚ ወቅታዊ ግምገማ ይመዝግቡ። ይህ የማሳያ ስርዓት ውሳኔ፣ ክስ ወይም በራስ-ሰር እርምጃ አይወስድም።"
        />
      </p>

      <label htmlFor="review-status">
        <Dual en="Review status" am="የግምገማ ሁኔታ" separator="" />
      </label>
      <select
        id="review-status"
        value={reviewStatus === "pending" ? "" : reviewStatus}
        onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
      >
        <option value="" disabled>
          {fieldText("Select review status", "የግምገማ ሁኔታ ይምረጡ")}
        </option>
        {(Object.keys(REVIEW_STATUSES) as ReviewStatus[])
          .filter((status) => status !== "pending")
          .map((status) => (
            <option key={status} value={status}>
              {fieldText(REVIEW_STATUSES[status].en, REVIEW_STATUSES[status].am)}
            </option>
          ))}
      </select>

      <label htmlFor="review-note">
        <Dual en="Reviewer note (optional)" am="የገምጋሚ ማስታወሻ (አማራጭ)" separator="" />
      </label>
      <textarea
        id="review-note"
        value={reviewNote}
        onChange={(e) => setReviewNote(e.target.value)}
        maxLength={500}
        placeholder={fieldText(
          "Add a short context note for this local session…",
          "ለዚህ የግምገማ መዝገብ አጭር የዐውድ ማስታወሻ ያክሉ…"
        )}
      />

      <p className="review-local-note">
        <Dual
          en="Saved only in this browser session; do not enter real personal, biometric, confidential, or government data."
          am="በዚህ የአሳሽ ክፍለ ጊዜ ብቻ ይቀመጣል፤ እውነተኛ የግል፣ ባዮሜትሪክ፣ ሚስጥራዊ ወይም የመንግሥት መረጃ አያስገቡ።"
        />
      </p>

      {record.reviewStatus && record.reviewStatus !== "pending" && (
        <div className="review-summary">
          <span className="review-summary-label">
            <Dual en="RECORDED ASSESSMENT" am="የተመዘገበ ግምገማ" separator="" />
          </span>
          <strong>{fieldText(REVIEW_STATUSES[record.reviewStatus].en, REVIEW_STATUSES[record.reviewStatus].am)}</strong>
          {record.reviewNote && <p>{fieldText(`Note: ${record.reviewNote}`, `ማስታወሻ፦ ${record.reviewNote}`)}</p>}
          {record.reviewDate && <small>{fieldText(`Last updated: ${record.reviewDate}`, `መጨረሻ የተዘመነው፦ ${record.reviewDate}`)}</small>}
        </div>
      )}

      <button
        className="save-review"
        onClick={() => onSaveReview(record.id, reviewStatus, reviewNote)}
        disabled={reviewStatus === "pending"}
      >
        <Dual en="Save local review" am="የግምገማ ውጤት አስቀምጥ" separator="" />
      </button>
    </section>
  );
}
