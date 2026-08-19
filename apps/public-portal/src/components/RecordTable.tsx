import { Dual } from "./Dual";
import { ReviewSummaryBar } from "./ReviewSummaryBar";
import {
  REVIEW_FILTER_OPTIONS,
  REVIEW_STATUSES,
  type ReviewFilter,
} from "../reviewFilter";
import type { Language, RecordItem, SignalDefinition, SignalKey } from "../types";

const money = new Intl.NumberFormat("en-US");

type RecordTableProps = {
  records: RecordItem[];
  visibleRecords: RecordItem[];
  language: Language;
  query: string;
  buyer: string;
  signalFilter: "all" | "flagged" | SignalKey;
  reviewFilter: ReviewFilter;
  newRecordId: string | null;
  successMessage: string;
  signalsMap: Record<SignalKey, SignalDefinition>;
  onQueryChange: (q: string) => void;
  onBuyerChange: (b: string) => void;
  onSignalFilterChange: (s: "all" | "flagged" | SignalKey) => void;
  onReviewFilterChange: (r: ReviewFilter) => void;
  onResetFilters: () => void;
  onOpenAddModal: () => void;
  onSelectRecord: (record: RecordItem) => void;
  onResetReviews: () => void;
};

export function RecordTable({
  records,
  visibleRecords,
  language,
  query,
  buyer,
  signalFilter,
  reviewFilter,
  newRecordId,
  successMessage,
  signalsMap,
  onQueryChange,
  onBuyerChange,
  onSignalFilterChange,
  onReviewFilterChange,
  onResetFilters,
  onOpenAddModal,
  onSelectRecord,
  onResetReviews,
}: RecordTableProps) {
  const showEn = language !== "am";
  const showAm = language !== "en";
  const fieldText = (en: string, am: string) =>
    language === "am" ? am : language === "en" ? en : `${en} · ${am}`;

  const isFiltered =
    query !== "" ||
    buyer !== "all" ||
    signalFilter !== "all" ||
    reviewFilter !== "all";

  const uniqueBuyers = [...new Set(records.map((r) => r.buyer))];

  return (
    <section className="records" id="records">
      <div className="section-title">
        <div>
          <p className="eyebrow">
            <Dual en="RECENT ACTIVITY" am="የቅርብ ጊዜ እንቅስቃሴ" />
          </p>
          <h2>
            <span className="en-only">Procurement records</span>{" "}
            <span className="am-only">የግዥ መዝገቦች</span>
          </h2>
        </div>
        <div className="section-title-actions">
          <p className="en-only">
            {visibleRecords.length} of {records.length} shown
          </p>
          <p className="am-only">
            ከ{records.length} ውስጥ {visibleRecords.length} ታይቷል
          </p>
          <button className="add-record-btn" onClick={onOpenAddModal}>
            <span className="en-only">+ Add sample record</span>
            <span className="am-only">+ የሙከራ መዝገብ ጨምር</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="success-message" role="status">
          <span className="success-icon">✓</span>
          <p>{successMessage}</p>
        </div>
      )}

      {/* Filterbar */}
      <div className="filterbar">
        <label className="search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={fieldText(
              "Search ID, item, supplier…",
              "መለያ፣ ዕቃ ወይም አቅራቢ ፈልግ…"
            )}
            aria-label={fieldText("Search records", "መዝገቦችን ፈልግ")}
          />
        </label>

        <select
          value={buyer}
          onChange={(e) => onBuyerChange(e.target.value)}
          aria-label={fieldText("Filter by buyer", "በገዢ አጣራ")}
        >
          <option value="all">{fieldText("All buyers", "ሁሉም ገዢዎች")}</option>
          {uniqueBuyers.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={signalFilter}
          onChange={(e) => onSignalFilterChange(e.target.value as typeof signalFilter)}
          aria-label={fieldText("Filter by signal", "በምልክት አጣራ")}
        >
          <option value="all">{fieldText("All signals", "ሁሉም ምልክቶች")}</option>
          <option value="flagged">
            {fieldText("Needs review", "ግምገማ ያስፈልገዋል")}
          </option>
          <option value="price">
            {fieldText("Comparative price", signalsMap.price.am)}
          </option>
          <option value="repeat">
            {fieldText("Repeated wins", signalsMap.repeat.am)}
          </option>
          <option value="delay">
            {fieldText("Overdue delay", signalsMap.delay.am)}
          </option>
        </select>

        <select
          value={reviewFilter}
          onChange={(e) => onReviewFilterChange(e.target.value as ReviewFilter)}
          aria-label={fieldText("Filter by human review", "በሰው ግምገማ አጣራ")}
          className="review-filter-select"
        >
          {REVIEW_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {fieldText(option.en, option.am)}
            </option>
          ))}
        </select>

        {isFiltered && (
          <button className="reset" onClick={onResetFilters}>
            <Dual en="Reset" am="ዳግም አስጀምር" separator="" />
          </button>
        )}
      </div>

      {/* Human Review Summary Bar */}
      <ReviewSummaryBar
        records={records}
        reviewFilter={reviewFilter}
        language={language}
        onSelectReviewFilter={onReviewFilterChange}
        onResetReviews={onResetReviews}
      />

      {/* Main Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <Dual en="Reference" am="መለያ" separator=" / " />
              </th>
              <th>
                <Dual en="Purchase" am="የግዥ ዕቃ" separator=" / " />
              </th>
              <th>
                <Dual en="Supplier" am="አቅራቢ" separator=" / " />
              </th>
              <th>
                <Dual en="Value" am="ጠቅላላ ዋጋ" separator=" / " />
              </th>
              <th>
                <Dual en="Status" am="ሁኔታ" separator=" / " />
              </th>
              <th>
                <Dual en="Review signals" am="የግምገማ ምልክቶች" separator=" / " />
              </th>
              <th>
                <Dual en="Human Review" am="የሰው ግምገማ" separator=" / " />
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRecords.map((record) => (
              <tr
                key={record.id}
                className={record.id === newRecordId ? "new-record" : ""}
                onClick={() => onSelectRecord(record)}
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") && onSelectRecord(record)
                }
              >
                <td>
                  <code>{record.id}</code>
                  <small>{record.date}</small>
                </td>
                <td>
                  <strong>{showEn && record.item}</strong>
                  {showAm && <span className="am">{record.itemAm}</span>}
                  <small>{showEn ? record.category : record.categoryAm}</small>
                </td>
                <td>
                  {record.supplier}
                  <small>{record.buyer}</small>
                </td>
                <td>
                  <strong>ETB {money.format(record.value)}</strong>
                  <small className="en-only">{record.bids} bids received</small>
                  <small className="am-only">{record.bids} ጨረታዎች ቀርበዋል</small>
                </td>
                <td>
                  <span
                    className={`status ${
                      record.status === "Paid" ? "paid" : "open"
                    }`}
                  >
                    {showEn ? record.status : record.statusAm}
                  </span>
                  <small>{record.daysOpen} days</small>
                </td>
                <td>
                  {record.signals.length ? (
                    <div className="signal-list">
                      {record.signals.map((key) => (
                        <span className={`tag ${key}`} key={key}>
                          {signalsMap[key].icon}{" "}
                          {showEn ? signalsMap[key].short : signalsMap[key].shortAm}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="clear">
                      ✓ <Dual en="No signal" am="ምልክት የለም" />
                    </span>
                  )}
                </td>
                <td>
                  {record.reviewStatus && record.reviewStatus !== "pending" ? (
                    <span className="review-table-status">
                      <Dual
                        en={REVIEW_STATUSES[record.reviewStatus].en}
                        am={REVIEW_STATUSES[record.reviewStatus].am}
                        separator=" / "
                      />
                    </span>
                  ) : (
                    <span className="review-table-none">
                      <Dual
                        en="Not yet reviewed"
                        am="ገና አልተገመገመም"
                        separator=" / "
                      />
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {!visibleRecords.length && (
              <tr>
                <td colSpan={7} className="empty">
                  <Dual en="No matching records" am="ተዛማጅ መዝገብ የለም" />
                  <br />
                  <button onClick={onResetFilters}>
                    <Dual en="Clear filters" am="ማጣሪያዎችን አጽዳ" separator="" />
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="hint">
        <Dual
          en="Select a row to inspect the evidence behind its signals."
          am="የምልክቱን ማብራሪያ እና ማስረጃ ለማየት መዝገቡን ይምረጡ።"
        />
      </p>
    </section>
  );
}
