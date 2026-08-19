import { Dual } from "./Dual";
import { REVIEW_STATUSES } from "../reviewFilter";
import type { Language, RecordItem } from "../types";

type ProcurementTimelineProps = {
  record: RecordItem;
  language: Language;
};

type MilestoneStep = {
  id: string;
  number: number;
  titleEn: string;
  titleAm: string;
  status: "completed" | "current" | "warning" | "pending";
  dateOrDetailEn: string;
  dateOrDetailAm: string;
  badgeEn?: string;
  badgeAm?: string;
};

export function ProcurementTimeline({ record, language }: ProcurementTimelineProps) {
  const isDelayFlagged = record.signals.includes("delay");
  const isPaid = record.status === "Paid";
  const isAwaitingPayment = record.status === "Awaiting payment";

  // Build sequential procurement lifecycle steps
  const steps: MilestoneStep[] = [
    {
      id: "published",
      number: 1,
      titleEn: "Tender Published",
      titleAm: "ጨረታ የወጣበት",
      status: "completed",
      dateOrDetailEn: "Public notice advertised",
      dateOrDetailAm: "የጨረታ ማስታወቂያ የወጣበት",
    },
    {
      id: "bidding",
      number: 2,
      titleEn: "Bids Received",
      titleAm: "ጨረታ የቀረበበት",
      status: "completed",
      dateOrDetailEn: `${record.bids} competitive bids`,
      dateOrDetailAm: `${record.bids} ተጫራቾች ቀርበዋል`,
      badgeEn: `${record.bids} Bids`,
      badgeAm: `${record.bids} ጨረታዎች`,
    },
    {
      id: "award",
      number: 3,
      titleEn: "Contract Award",
      titleAm: "ውል የጸደቀበት",
      status: "completed",
      dateOrDetailEn: record.date,
      dateOrDetailAm: record.date,
    },
    {
      id: "payment",
      number: 4,
      titleEn: isPaid ? "Payment Processed" : isAwaitingPayment ? "Payment Pending" : "Approval Pending",
      titleAm: isPaid ? "ክፍያ የተፈጸመበት" : isAwaitingPayment ? "ክፍያ በመጠበቅ ላይ" : "ውሳኔ በመጠበቅ ላይ",
      status: isPaid ? "completed" : isDelayFlagged ? "warning" : "current",
      dateOrDetailEn: isPaid
        ? "Settled in full"
        : `${record.daysOpen} days elapsed${isDelayFlagged ? " (Overdue)" : ""}`,
      dateOrDetailAm: isPaid
        ? "ሙሉ ክፍያ ተፈጽሟል"
        : `${record.daysOpen} ቀናት አልፈዋል${isDelayFlagged ? " (የዘገየ)" : ""}`,
      badgeEn: isPaid ? "Settled" : `${record.daysOpen}d`,
      badgeAm: isPaid ? "ተከፍሏል" : `${record.daysOpen}ቀን`,
    },
    {
      id: "review",
      number: 5,
      titleEn: "Audit Review",
      titleAm: "የሰው ግምገማ",
      status: record.reviewStatus && record.reviewStatus !== "pending" ? "completed" : "pending",
      dateOrDetailEn:
        record.reviewStatus && record.reviewStatus !== "pending"
          ? REVIEW_STATUSES[record.reviewStatus].en
          : "Awaiting local review",
      dateOrDetailAm:
        record.reviewStatus && record.reviewStatus !== "pending"
          ? REVIEW_STATUSES[record.reviewStatus].am
          : "የሰው ግምገማ በመጠበቅ ላይ",
    },
  ];

  return (
    <section className="procurement-timeline-section" aria-labelledby="timeline-heading">
      <div className="timeline-header">
        <p className="eyebrow">
          <Dual en="PROCUREMENT LIFECYCLE" am="የግዥ ሂደት የጊዜ ሰሌዳ" separator="" />
        </p>
        <h3 id="timeline-heading">
          <Dual en="Process Milestones & Execution" am="የውል ሂደት ደረጃዎች እና አፈጻጸም" separator=" · " />
        </h3>
      </div>

      <div className="timeline-stepper">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`timeline-step step-${step.status} ${index === steps.length - 1 ? "step-last" : ""}`}
          >
            <div className="step-track-wrapper">
              <div className="step-node">
                {step.status === "completed" ? (
                  <span className="step-check">✓</span>
                ) : step.status === "warning" ? (
                  <span className="step-warn">!</span>
                ) : (
                  <span className="step-num">{step.number}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`step-connector ${
                    step.status === "completed" ? "connector-done" : "connector-pending"
                  }`}
                />
              )}
            </div>

            <div className="step-content">
              <div className="step-title-wrap">
                <strong className="step-title">
                  <span className="en-only">{step.titleEn}</span>
                  <span className="am-only">{step.titleAm}</span>
                  <span className="lang-both">
                    {step.titleEn} <small className="am-sub">· {step.titleAm}</small>
                  </span>
                </strong>
                {step.badgeEn && (
                  <span className={`step-badge badge-${step.status}`}>
                    <Dual en={step.badgeEn} am={step.badgeAm || step.badgeEn} separator="" />
                  </span>
                )}
              </div>
              <p className="step-detail">
                <Dual en={step.dateOrDetailEn} am={step.dateOrDetailAm} separator=" · " />
              </p>
            </div>
          </div>
        ))}
      </div>

      {isDelayFlagged && (
        <div className="timeline-alert">
          <span className="alert-icon">⏱</span>
          <div>
            <strong>
              <Dual en="Overdue Process Delay Flagged" am="የሂደት መዘግየት ምልክት ተመዝግቧል" />
            </strong>
            <p>
              <Dual
                en={`This procurement has been active for ${record.daysOpen} days without final resolution, exceeding the 45-day review threshold.`}
                am={`ይህ ግዥ የመጨረሻ ውሳኔ ሳያገኝ ${record.daysOpen} ቀናት የቆየ ሲሆን፣ ይህም ከ45 ቀናት የማሳያ ገደብ በላይ ነው።`}
              />
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
