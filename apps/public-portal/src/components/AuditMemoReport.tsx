import { Dual } from "./Dual";
import { REVIEW_STATUSES } from "../reviewFilter";
import type { ComparableListing, MarketReferenceSummary } from "../marketReference";
import type { GeminiReviewGuidance } from "../geminiService";
import type { Language, RecordItem, SignalDefinition, SignalKey } from "../types";

const money = new Intl.NumberFormat("en-US");

type AuditMemoReportProps = {
  record: RecordItem;
  language: Language;
  signalsMap: Record<SignalKey, SignalDefinition>;
  comparables: ComparableListing[];
  marketSummary: MarketReferenceSummary | null;
  recordQuantity: number | null;
  recordUnitPrice: number | null;
  guidance: GeminiReviewGuidance | null;
  onClose: () => void;
};

export function AuditMemoReport({
  record,
  language,
  signalsMap,
  comparables,
  marketSummary,
  recordQuantity,
  recordUnitPrice,
  guidance,
  onClose,
}: AuditMemoReportProps) {
  const showEn = language !== "am";
  const showAm = language !== "en";
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="audit-memo-overlay" role="dialog" aria-modal="true" aria-labelledby="memo-title">
      <div className="audit-memo-actions-bar no-print">
        <div className="memo-bar-info">
          <strong>
            <Dual en="Audit Memorandum Preview" am="የግምገማ ሪፖርት ቅድመ-ዕይታ" />
          </strong>
          <span> · {record.id}</span>
        </div>
        <div className="memo-bar-buttons">
          <button className="btn-memo-print" onClick={handlePrint}>
            <span className="print-icon">⎙</span>
            <Dual en="Print / Save PDF" am="አትም / በPDF አስቀምጥ" separator="" />
          </button>
          <button className="btn-memo-close" onClick={onClose}>
            <Dual en="Close Preview" am="ዝጋ" separator="" />
          </button>
        </div>
      </div>

      <div className="audit-memo-document" id="printable-memo">
        {/* Institutional Document Header */}
        <header className="memo-doc-header">
          <div className="memo-brand-block">
            <span className="memo-brand-mark">ግ</span>
            <div>
              <h1 id="memo-title">
                <span className="en-only">PUBLIC PROCUREMENT AUDIT MEMO</span>
                <span className="am-only">የመንግስት ግዥ ግምገማ ማጠቃለያ ሪፖርት</span>
                <span className="memo-bilingual-sub lang-both">
                  ግልጽ ግዥ · Transparency & Human Review Memorandum
                </span>
              </h1>
              <p className="memo-doc-subtitle">
                <Dual
                  en="Explainable Review Dossier · Authorized Human Review Only"
                  am="ግልጽ የግዥ ግምገማ ሰነድ · ፈቃድ ላለው የሰው ግምገማ ብቻ"
                />
              </p>
            </div>
          </div>
          <div className="memo-meta-block">
            <div className="meta-row">
              <span className="meta-label">
                <Dual en="Dossier Ref" am="የመዝገብ መለያ" />:
              </span>
              <strong>{record.id}</strong>
            </div>
            <div className="meta-row">
              <span className="meta-label">
                <Dual en="Generated Date" am="የወጣበት ቀን" />:
              </span>
              <span>{today}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">
                <Dual en="Status" am="የግምገማ ሁኔታ" />:
              </span>
              <span className="memo-status-badge">
                {record.reviewStatus && record.reviewStatus !== "pending" ? (
                  <Dual
                    en={REVIEW_STATUSES[record.reviewStatus].en}
                    am={REVIEW_STATUSES[record.reviewStatus].am}
                    separator=" / "
                  />
                ) : (
                  <Dual en="Pending Human Review" am="ግምገማ በመጠበቅ ላይ" separator=" / " />
                )}
              </span>
            </div>
          </div>
        </header>

        {/* Section 1: Contract Particulars */}
        <section className="memo-section">
          <h2 className="memo-section-title">
            <Dual en="1. Contract Particulars" am="1. የውል ዝርዝር መረጃ" />
          </h2>
          <table className="memo-table">
            <tbody>
              <tr>
                <th style={{ width: "22%" }}>
                  <Dual en="Procurement Item" am="የግዥ ዕቃ ስም" />
                </th>
                <td style={{ width: "28%" }}>
                  <strong>{showEn && record.item}</strong>
                  {showAm && <div className="memo-am">{record.itemAm}</div>}
                </td>
                <th style={{ width: "22%" }}>
                  <Dual en="Total Contract Value" am="ጠቅላላ የውል ዋጋ" />
                </th>
                <td style={{ width: "28%" }}>
                  <strong className="memo-value-highlight">ETB {money.format(record.value)}</strong>
                </td>
              </tr>
              <tr>
                <th>
                  <Dual en="Buyer Entity" am="ገዢ መሥሪያ ቤት" />
                </th>
                <td>{record.buyer}</td>
                <th>
                  <Dual en="Supplier Entity" am="አቅራቢ ድርጅት" />
                </th>
                <td>
                  <strong>{record.supplier}</strong>
                </td>
              </tr>
              <tr>
                <th>
                  <Dual en="Procurement Category" am="የግዥ ምድብ" />
                </th>
                <td>{showEn ? record.category : record.categoryAm}</td>
                <th>
                  <Dual en="Bids Received" am="የቀረቡ ጨረታዎች" />
                </th>
                <td>{record.bids} bids</td>
              </tr>
              <tr>
                <th>
                  <Dual en="Approval Date" am="የጸደቀበት ቀን" />
                </th>
                <td>{record.date}</td>
                <th>
                  <Dual en="Execution Status" am="የክፍያ/የውል ሁኔታ" />
                </th>
                <td>
                  {showEn ? record.status : record.statusAm} ({record.daysOpen} days)
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 2: Review Signals */}
        <section className="memo-section">
          <h2 className="memo-section-title">
            <Dual en="2. Transparent Review Signals" am="2. የግምገማ ምልክቶች እና ማብራሪያ" />
          </h2>
          {record.signals.length ? (
            <div className="memo-signals-list">
              {record.signals.map((key) => (
                <div className={`memo-signal-card signal-${key}`} key={key}>
                  <div className="signal-card-head">
                    <span className="signal-badge">
                      {signalsMap[key].icon} {showEn ? signalsMap[key].label : signalsMap[key].am}
                    </span>
                  </div>
                  <p className="signal-en en-only">{signalsMap[key].detail}</p>
                  <p className="signal-am am-only">{signalsMap[key].detailAm}</p>
                  {showEn && showAm && (
                    <div className="signal-both">
                      <p>{signalsMap[key].detail}</p>
                      <p className="memo-am">{signalsMap[key].detailAm}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="memo-no-signals">
              ✓{" "}
              <Dual
                en="No review signals attached. Contract values and timelines are within standard parameters."
                am="ምንም የግምገማ ምልክት የለም። የውል ዋጋ እና የጊዜ ሰሌዳ በመደበኛ ገደቦች ውስጥ ናቸው።"
              />
            </div>
          )}
        </section>

        {/* Section 3: Market Reference Comparison */}
        {marketSummary && (
          <section className="memo-section">
            <h2 className="memo-section-title">
              <Dual en="3. Market Reference Benchmark" am="3. የገበያ ዋጋ ንጽጽር ማጠቃለያ" />
            </h2>
            <div className="memo-benchmark-box">
              <div className="benchmark-metrics-row">
                <div className="b-metric">
                  <small>
                    <Dual en="Comparables Count" am="የማነጻጸሪያዎች ብዛት" />
                  </small>
                  <b>{marketSummary.count}</b>
                </div>
                <div className="b-metric">
                  <small>
                    <Dual en="Low Unit Price" am="ዝቅተኛ ዋጋ" />
                  </small>
                  <b>ETB {money.format(marketSummary.low)}</b>
                </div>
                <div className="b-metric metric-median">
                  <small>
                    <Dual en="Median Unit Price" am="መካከለኛ ዋጋ" />
                  </small>
                  <b>ETB {money.format(marketSummary.median)}</b>
                </div>
                <div className="b-metric">
                  <small>
                    <Dual en="High Unit Price" am="ከፍተኛ ዋጋ" />
                  </small>
                  <b>ETB {money.format(marketSummary.high)}</b>
                </div>
                {recordQuantity && recordUnitPrice !== null && (
                  <div className="b-metric metric-record">
                    <small>
                      <Dual en="Record Unit Price" am="የመዝገቡ የአንድ እቃ ዋጋ" />
                    </small>
                    <b>ETB {money.format(recordUnitPrice)}</b>
                  </div>
                )}
              </div>

              {marketSummary.differenceFromMedian !== null &&
                marketSummary.percentFromMedian !== null && (
                  <div className="memo-variance-notice">
                    <strong>
                      <Dual en="Variance against median" am="ከመካከለኛው ዋጋ ጋር ያለው ልዩነት" />:
                    </strong>{" "}
                    {marketSummary.percentFromMedian >= 0 ? "+" : ""}
                    {marketSummary.percentFromMedian.toFixed(1)}% (ETB{" "}
                    {money.format(Math.abs(marketSummary.differenceFromMedian))}{" "}
                    {marketSummary.differenceFromMedian >= 0 ? "above" : "below"} median)
                  </div>
                )}
            </div>
          </section>
        )}

        {/* Section 4: Human Review Recorded Assessment */}
        <section className="memo-section">
          <h2 className="memo-section-title">
            <Dual en="4. Authorized Reviewer Assessment" am="4. የተመዘገበ የገምጋሚ ውሳኔ" />
          </h2>
          <div className="memo-assessment-box">
            <div className="assessment-row">
              <span className="assessment-label">
                <Dual en="Recorded Review Status" am="የተመዘገበው ሁኔታ" />:
              </span>
              <strong className="assessment-status">
                {record.reviewStatus && record.reviewStatus !== "pending" ? (
                  <Dual
                    en={REVIEW_STATUSES[record.reviewStatus].en}
                    am={REVIEW_STATUSES[record.reviewStatus].am}
                    separator=" · "
                  />
                ) : (
                  <Dual en="Pending Authorized Review" am="ግምገማ በመጠበቅ ላይ" />
                )}
              </strong>
            </div>

            {record.reviewDate && (
              <div className="assessment-row">
                <span className="assessment-label">
                  <Dual en="Assessment Date" am="የተገመገመበት ቀን" />:
                </span>
                <span>{record.reviewDate}</span>
              </div>
            )}

            <div className="assessment-row notes-row">
              <span className="assessment-label">
                <Dual en="Reviewer Context Note" am="የገምጋሚ የዐውድ ማስታወሻ" />:
              </span>
              <p className="assessment-note-text">
                {record.reviewNote || (
                  <em className="text-muted">
                    <Dual en="No specific notes recorded." am="ምንም ተጨማሪ ማስታወሻ አልተመዘገበም።" />
                  </em>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Verification Checklist Questions */}
        <section className="memo-section">
          <h2 className="memo-section-title">
            <Dual en="5. Auditor / Committee Verification Checklist" am="5. የአረጋጋጭ ገምጋሚ የፍተሻ ጥያቄዎች" />
          </h2>
          <ol className="memo-checklist">
            {guidance ? (
              showEn ? (
                guidance.questionsEn.map((q, i) => <li key={i}>{q}</li>)
              ) : (
                guidance.questionsAm.map((q, i) => <li key={i}>{q}</li>)
              )
            ) : (
              <>
                <li>
                  <Dual
                    en="Have all original tender bid opening minutes and evaluation reports been verified?"
                    am="የጨረታ መክፈቻ ቃለ-ጉባኤዎች እና የግምገማ ሪፖርቶች ተረጋግጠዋል?"
                  />
                </li>
                <li>
                  <Dual
                    en="Are specifications and quantities strictly comparable to prevailing framework agreements?"
                    am="የዕቃው ዝርዝር መግለጫና ብዛት ከመደበኛ የውል ማዕቀፎች ጋር ተመጣጣኝ መሆናቸው ተረጋግጧል?"
                  />
                </li>
                <li>
                  <Dual
                    en="Are invoice delivery receipts and inspection notes signed by the receiving entity?"
                    am="የዕቃ ማስረከቢያ ደረሰኞችና የጥራት ማረጋገጫዎች በተረካቢው መሥሪያ ቤት ተፈርመዋል?"
                  />
                </li>
              </>
            )}
          </ol>
        </section>

        {/* Section 6: Official Sign-Off Block */}
        <footer className="memo-signoff-block">
          <div className="sign-col">
            <div className="sign-line" />
            <span>
              <Dual en="Authorized Reviewer / Auditor Signature" am="ፈቃድ ያለው ገምጋሚ / ኦዲተር ፊርማ" />
            </span>
          </div>
          <div className="sign-col">
            <div className="sign-line" />
            <span>
              <Dual en="Verification Date" am="የተረጋገጠበት ቀን" />
            </span>
          </div>
          <div className="sign-col">
            <div className="sign-stamp-box">
              <Dual en="OFFICIAL STAMP" am="ማህተም" />
            </div>
          </div>
        </footer>

        <div className="memo-disclaimer">
          <Dual
            en="NOTICE: This memorandum is generated from synthetic transparency demonstration records for authorized human review only. It does not constitute proof of wrongdoing, legal accusation, or automated finding."
            am="ማሳሰቢያ፦ ይህ ማጠቃለያ ሰነድ ከሰው ሰራሽ የሙከራ መረጃዎች የተዘጋጀ ሲሆን ፈቃድ ላለው የሰው ግምገማ ብቻ የሚያገለግል ነው። የጥፋተኝነት ወይም የህግ ውሳኔ ማስረጃ አይደለም።"
          />
        </div>
      </div>
    </div>
  );
}
