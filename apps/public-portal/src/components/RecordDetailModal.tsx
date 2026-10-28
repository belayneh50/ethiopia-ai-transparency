import { useAuth } from '../auth/AuthContext';
import { AuditHistory } from './AuditHistory';
import { useState } from "react";
import { Dual } from "./Dual";
import { ShieldNotice } from "./ShieldNotice";
import { ProcurementTimeline } from "./ProcurementTimeline";
import { HumanReviewPanel } from "./HumanReviewPanel";
import { MarketReferencePanel } from "./MarketReferencePanel";
import { GeminiGuidancePanel } from "./GeminiGuidancePanel";
import { AuditMemoReport } from "./AuditMemoReport";
import { resolveRecordQuantity, calculateMarketReference, type ComparableListing } from "../marketReference";
import type { ReviewStatus } from "../reviewFilter";
import type { GeminiReviewGuidance } from "../geminiService";
import type { Language, RecordItem, SignalDefinition, SignalKey } from "../types";

const money = new Intl.NumberFormat("en-US");

type RecordDetailModalProps = {
  record: RecordItem;
  language: Language;
  signalsMap: Record<SignalKey, SignalDefinition>;
  comparables: ComparableListing[];
  guidance: GeminiReviewGuidance | null;
  guidanceLoading: boolean;
  onClose: () => void;
  onEdit?: () => void;
  feedback?: string;
  onRefresh?: () => void;
  onSaveReview: (recordId: string, status: ReviewStatus, note: string) => void;
  onAddComparable: (listing: ComparableListing) => void | Promise<void>;
  onRemoveComparable: (id: string) => void;
  onAskGemini: () => void;
  onOpenFayda: () => void;
};

type TabKey = "overview" | "market" | "review" | "guidance";

export function RecordDetailModal({
  record,
  language,
  signalsMap,
  comparables,
  guidance,
  guidanceLoading,
  onClose,
  onEdit,
  feedback,
  onRefresh,
  onSaveReview,
  onAddComparable,
  onRemoveComparable,
  onAskGemini,
  onOpenFayda,
}: RecordDetailModalProps) {
  const { can } = useAuth();
  const [showMemo, setShowMemo] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const showEn = language !== "am";
  const showAm = language !== "en";

  const recordQuantity = resolveRecordQuantity(record.item, record.quantity);
  const recordUnitPrice = recordQuantity ? record.value / recordQuantity : null;
  const marketSummary = calculateMarketReference(comparables, recordUnitPrice);
  const unitComparisonAvailable =
    marketSummary !== null &&
    recordQuantity !== null &&
    recordUnitPrice !== null &&
    marketSummary.differenceFromMedian !== null &&
    marketSummary.percentFromMedian !== null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="modal record-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-top-actions">
          <button
            className="btn-open-memo"
            onClick={() => setShowMemo(true)}
            aria-label="Generate printable audit memo"
          >
            <span className="memo-icon">📄</span>
            <Dual en="Audit Memo / Print" am="የግምገማ ሪፖርት / አትም" separator=" · " />
          </button>
          <button className="close" onClick={onClose} aria-label="Close record details">
            ×
          </button>
        </div>

        <p className="eyebrow">
          {record.id} · <Dual en="EXPLAINABLE REVIEW" am="ግልጽ ግምገማ" separator="" />
        </p>
        <h2 id="detail-title">
          <span className="en-only">{record.item}</span>
          <span className="am-only">{record.itemAm}</span>
        </h2>

        {feedback && <p role="alert">{feedback}</p>}
        {onRefresh && <button onClick={onRefresh}><Dual en="Reload saved record (replaces the draft)" am="የተቀመጠውን መዝገብ ጫን (ረቂቁን ይተካል)" /></button>}
        <div className="modal-tabs no-print">
          <button
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => setActiveTab("overview")}
          >
            <Dual en="Overview" am="አጠቃላይ እይታ" />
          </button>
          <button
            className={activeTab === "market" ? "active" : ""}
            disabled={!can('accessMarketComparisons')} onClick={() => setActiveTab("market")}
          >
            <Dual en="Market Range" am="የገበያ ዋጋ" />
          </button>
          <button
            className={activeTab === "review" ? "active" : ""}
            disabled={!can('performHumanReview')} onClick={() => setActiveTab("review")}
          >
            <Dual en="Human Review" am="የሰው ግምገማ" />
          </button>
          <button
            className={activeTab === "guidance" ? "active" : ""}
            disabled={!can('requestGemini')} onClick={() => setActiveTab("guidance")}
          >
            <Dual en="AI Guidance" am="የAI መመሪያ" />
          </button>
        </div>

        <div className="modal-tab-content">
          {activeTab === "overview" && (
            <>
              <div className="detail-grid">
                <div>
                  <small>Supplier · አቅራቢ ድርጅት</small>
                  <b>{record.supplier}</b>
                </div>
                <div>
                  <small>Value · ጠቅላላ ዋጋ</small>
                  <b>ETB {money.format(record.value)}</b>
                </div>
                <div>
                  <small>Buyer · ገዢ መሥሪያ ቤት</small>
                  <b>{record.buyer}</b>
                </div>
                <div>
                  <small>Status · የውል ሁኔታ</small>
                  <b>
                    {record.status} · {record.daysOpen} days
                  </b>
                </div>
              </div>

              {/* Visual Procurement Milestone Stepper */}
              <ProcurementTimeline record={record} language={language} />

              {/* Signals explanation cards */}
              <div className="explanations">
                {record.signals.length ? (
                  record.signals.map((key) => (
                    <article key={key}>
                      <span className={`signal-icon ${key}`}>{signalsMap[key].icon}</span>
                      <div>
                        <h3>
                          <span className="en-only">{signalsMap[key].label}</span>
                          <span className="am-only">{signalsMap[key].am}</span>
                        </h3>
                        <p className="en-only">{signalsMap[key].detail}</p>
                        <p className="am-copy am-only">{signalsMap[key].detailAm}</p>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="no-flags">
                    <b>
                      ✓ <Dual en="No review signal attached" am="የግምገማ ምልክት የለም" />
                    </b>
                    <p>
                      <Dual
                        en="This sample record did not cross any of the three demonstration thresholds."
                        am="ይህ የሙከራ መዝገብ ከሦስቱ የማሳያ ገደቦች አንዱንም አላለፈም።"
                      />
                    </p>
                  </div>
                )}
              </div>

              <ShieldNotice />
            </>
          )}

          {activeTab === "market" && can('accessMarketComparisons') && (
            <MarketReferencePanel
              record={record}
              language={language}
              comparables={comparables}
              onAddComparable={onAddComparable}
              onRemoveComparable={onRemoveComparable}
            />
          )}

          {activeTab === "review" && can('performHumanReview') && (
            <HumanReviewPanel
              record={record}
              language={language}
              onSaveReview={onSaveReview}
              onOpenFayda={onOpenFayda}
            />
          )}

          {activeTab === "guidance" && can('requestGemini') && (
            <GeminiGuidancePanel
              record={record}
              language={language}
              guidance={guidance}
              loading={guidanceLoading}
              unitComparisonAvailable={unitComparisonAvailable}
              marketSummary={marketSummary}
              onAskGemini={onAskGemini}
            />
          )}
        </div>

        {onEdit && <button onClick={onEdit}><Dual en="Edit record" am="መዝገብ አስተካክል" /></button>}
        {can('viewInternalNotes') && record.databaseId && <AuditHistory recordId={record.databaseId} revision={record.version} />}
        {showMemo && (
          <AuditMemoReport
            record={record}
            language={language}
            signalsMap={signalsMap}
            comparables={comparables}
            marketSummary={marketSummary}
            recordQuantity={recordQuantity}
            recordUnitPrice={recordUnitPrice}
            guidance={guidance}
            onClose={() => setShowMemo(false)}
          />
        )}
      </section>
    </div>
  );
}
