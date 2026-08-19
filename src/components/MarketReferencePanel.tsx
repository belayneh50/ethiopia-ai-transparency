import { useState } from "react";
import { Dual } from "./Dual";
import { PriceBenchmarkChart } from "./PriceBenchmarkChart";
import {
  calculateMarketReference,
  extractRecordQuantity,
  type ComparableListing,
} from "../marketReference";
import type { Language, RecordItem } from "../types";

const money = new Intl.NumberFormat("en-US");

type MarketReferencePanelProps = {
  record: RecordItem;
  language: Language;
  comparables: ComparableListing[];
  onAddComparable: (listing: ComparableListing) => void;
  onRemoveComparable: (id: string) => void;
};

export function MarketReferencePanel({
  record,
  language,
  comparables,
  onAddComparable,
  onRemoveComparable,
}: MarketReferencePanelProps) {
  const [draft, setDraft] = useState({
    item: "",
    condition: "",
    price: "",
    sourceUrl: "",
    observationDate: "",
    note: "",
  });
  const [hasError, setHasError] = useState(false);

  const showEn = language !== "am";
  const showAm = language !== "en";
  const fieldText = (en: string, am: string) =>
    language === "am" ? am : language === "en" ? en : `${en} · ${am}`;

  const recordQuantity = extractRecordQuantity(record.item);
  const recordUnitPrice = recordQuantity ? record.value / recordQuantity : null;
  const marketSummary = calculateMarketReference(comparables, recordUnitPrice);
  const unitComparisonAvailable =
    marketSummary !== null &&
    recordQuantity !== null &&
    recordUnitPrice !== null &&
    marketSummary.differenceFromMedian !== null &&
    marketSummary.percentFromMedian !== null;

  const handleAdd = () => {
    if (comparables.length >= 5) return;
    const price = Number(draft.price);
    let urlValid = true;
    if (draft.sourceUrl.trim()) {
      try {
        const url = new URL(draft.sourceUrl);
        urlValid = url.protocol === "http:" || url.protocol === "https:";
      } catch {
        urlValid = false;
      }
    }
    const dateValid =
      /^\d{4}-\d{2}-\d{2}$/.test(draft.observationDate) &&
      !Number.isNaN(Date.parse(`${draft.observationDate}T00:00:00Z`));

    if (
      !draft.item.trim() ||
      !draft.condition.trim() ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !urlValid ||
      !dateValid
    ) {
      setHasError(true);
      return;
    }

    const listing: ComparableListing = {
      id: crypto.randomUUID(),
      item: draft.item.trim(),
      condition: draft.condition.trim(),
      price,
      sourceUrl: draft.sourceUrl.trim(),
      observationDate: draft.observationDate,
      note: draft.note.trim(),
    };

    onAddComparable(listing);
    setDraft({
      item: "",
      condition: "",
      price: "",
      sourceUrl: "",
      observationDate: "",
      note: "",
    });
    setHasError(false);
  };

  return (
    <section className="market-reference" aria-labelledby="market-reference-title">
      <p className="eyebrow">
        <Dual en="MARKET REFERENCE RANGE" am="የገበያ ማጣቀሻ ዋጋ" />
      </p>
      <h3 id="market-reference-title">
        <Dual en="Reviewer-supplied comparisons" am="በገምጋሚ የቀረቡ የገበያ ማነጻጸሪያዎች" />
      </h3>
      <p className="market-intro-text">
        <Dual
          en="This is not a correct or fair price. An authorized human reviewer must verify sources, specifications, taxes, delivery, and location. Entries stay in this browser session only; no website is scraped."
          am="ይህ የመጨረሻ ትክክለኛ ወይም አስገዳጅ ዋጋ አይደለም። ፈቃድ ያለው ገምጋሚ የዕቃውን ዝርዝር መግለጫ፣ ግብር፣ ማጓጓዣ እና ቦታውን ማረጋገጥ አለበት። መረጃው በዚህ የአሳሽ ክፍለ ጊዜ ብቻ ይቆያል፤ ምንም ድረ-ገጽ በራስ-ሰር አይሰበሰብም።"
        />
      </p>

      {/* Existing comparables list */}
      {comparables.map((listing) => (
        <article className="comparable" key={listing.id}>
          <div>
            <b>
              {showEn && listing.item}
              {showEn && showAm && listing.itemAm && " · "}
              {showAm && (listing.itemAm || listing.item)}
            </b>
            <small>
              {showEn && listing.condition}
              {showEn && showAm && listing.conditionAm && " · "}
              {showAm && (listing.conditionAm || listing.condition)} · ETB{" "}
              {money.format(listing.price)} · {listing.observationDate}
            </small>
            {listing.sourceUrl && (
              <a href={listing.sourceUrl} target="_blank" rel="noreferrer">
                {listing.sourceUrl}
              </a>
            )}
            {listing.note && (
              <small>
                {showEn && listing.note}
                {showEn && showAm && listing.noteAm && " · "}
                {showAm && (listing.noteAm || listing.note)}
              </small>
            )}
            <em>
              <Dual en="Reviewer-supplied" am="በገምጋሚ የቀረበ" />
            </em>
          </div>
          <button onClick={() => onRemoveComparable(listing.id)}>
            <Dual en="Remove" am="አስወግድ" />
          </button>
        </article>
      ))}

      {/* Numerical comparison summary */}
      {marketSummary && (
        <div className="market-summary">
          <div className="market-summary-card">
            <span className="market-card-label">
              <Dual en="Comparable count" am="የማነጻጸሪያዎች ብዛት" separator=" / " />
            </span>
            <b className="market-card-value">{marketSummary.count}</b>
          </div>
          <div className="market-summary-card">
            <span className="market-card-label">
              <Dual en="Low unit price" am="ዝቅተኛ የአንድ እቃ ዋጋ" separator=" / " />
            </span>
            <b className="market-card-value">ETB {money.format(marketSummary.low)}</b>
          </div>
          <div className="market-summary-card">
            <span className="market-card-label">
              <Dual en="Median unit price" am="መካከለኛ የአንድ እቃ ዋጋ" separator=" / " />
            </span>
            <b className="market-card-value">ETB {money.format(marketSummary.median)}</b>
          </div>
          <div className="market-summary-card">
            <span className="market-card-label">
              <Dual en="High unit price" am="ከፍተኛ የአንድ እቃ ዋጋ" separator=" / " />
            </span>
            <b className="market-card-value">ETB {money.format(marketSummary.high)}</b>
          </div>
          <div className="market-summary-card">
            <span className="market-card-label">
              <Dual en="Total record value" am="ጠቅላላ የመዝገብ ዋጋ" separator=" / " />
            </span>
            <b className="market-card-value">ETB {money.format(record.value)}</b>
          </div>

          {recordQuantity && recordUnitPrice !== null ? (
            <>
              <div className="market-summary-card">
                <span className="market-card-label">
                  <Dual en="Record quantity" am="የዕቃው ብዛት" separator=" / " />
                </span>
                <b className="market-card-value">{money.format(recordQuantity)}</b>
              </div>
              <div className="market-summary-card">
                <span className="market-card-label">
                  <Dual en="Record unit price" am="የአንድ ዕቃ ዋጋ" separator=" / " />
                </span>
                <b className="market-card-value">ETB {money.format(recordUnitPrice)}</b>
              </div>
              <div className="market-summary-analysis">
                <p>
                  <Dual
                    en={`Record unit price is ETB ${money.format(
                      Math.abs(marketSummary.differenceFromMedian!)
                    )} (${Math.abs(marketSummary.percentFromMedian!).toFixed(1)}%) ${
                      marketSummary.differenceFromMedian! >= 0 ? "above" : "below"
                    } the median unit price.`}
                    am={`የመዝገቡ የአንድ እቃ ዋጋ ከመካከለኛው የአንድ እቃ ዋጋ በETB ${money.format(
                      Math.abs(marketSummary.differenceFromMedian!)
                    )} (${Math.abs(marketSummary.percentFromMedian!).toFixed(1)}%) ${
                      marketSummary.differenceFromMedian! >= 0 ? "በላይ" : "በታች"
                    } ነው።`}
                  />
                </p>
              </div>
            </>
          ) : (
            <p className="form-error">
              <Dual
                en="A quantity could not be detected from this synthetic record label, so no per-unit comparison is calculated. An authorized reviewer must verify quantity rather than infer it."
                am="ከዚህ ሰው ሰራሽ መዝገብ ስያሜ ብዛት ሊለይ አልቻለም፤ ስለዚህ የአንድ እቃ ማነጻጸሪያ አልተሰላም። ፈቃድ ያለው ገምጋሚ ብዛቱን ማረጋገጥ አለበት እንጂ መገመት የለበትም።"
              />
            </p>
          )}

          <small className="formula">
            <Dual
              en="Method: record unit price = total record value ÷ explicit quantity in the record label. Sort reviewer-entered unit prices; median = middle price (or mean of two middle prices). Comparison = record unit price − median unit price."
              am="ስሌት ዘዴ፦ የመዝገብ የአንድ እቃ ዋጋ = ጠቅላላ የመዝገብ ዋጋ ÷ በመዝገብ ስያሜው የተገለጸ ብዛት። በገምጋሚ የገቡ የአንድ እቃ ዋጋዎችን መደርደር፤ መካከለኛ = መሃል ዋጋ (ወይም የሁለቱ መሃል ዋጋዎች አማካይ)። ማነጻጸሪያ = የመዝገብ የአንድ እቃ ዋጋ − መካከለኛ የአንድ እቃ ዋጋ።"
            />
          </small>
        </div>
      )}

      {/* Visual Benchmark Gauge Chart */}
      {unitComparisonAvailable && (
        <PriceBenchmarkChart
          low={marketSummary.low}
          median={marketSummary.median}
          high={marketSummary.high}
          recordUnitPrice={recordUnitPrice}
          differenceFromMedian={marketSummary.differenceFromMedian!}
          percentFromMedian={marketSummary.percentFromMedian!}
          language={language}
        />
      )}

      {/* Add comparable form */}
      {comparables.length < 5 && (
        <div className="comparable-form">
          <input
            aria-label={fieldText("Item or specification", "ዕቃ ወይም ዝርዝር መግለጫ")}
            placeholder={fieldText("Item / specification *", "ዕቃ / ዝርዝር መግለጫ *")}
            value={draft.item}
            onChange={(e) => setDraft({ ...draft, item: e.target.value })}
          />
          <input
            aria-label={fieldText("Condition", "የዕቃው ሁኔታ")}
            placeholder={fieldText("Condition (e.g., New) *", "የዕቃው ሁኔታ (ለምሳሌ፦ አዲስ) *")}
            value={draft.condition}
            onChange={(e) => setDraft({ ...draft, condition: e.target.value })}
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            aria-label={fieldText("Unit price in ETB", "የአንድ እቃ ዋጋ በብር")}
            placeholder={fieldText("Unit price ETB *", "የአንድ እቃ ዋጋ በብር *")}
            value={draft.price}
            onChange={(e) => setDraft({ ...draft, price: e.target.value })}
          />
          <input
            type="url"
            aria-label={fieldText("Source URL", "የመረጃው ድረ-ገጽ")}
            placeholder={fieldText("Source URL (optional)", "የመረጃው ድረ-ገጽ (አማራጭ)")}
            value={draft.sourceUrl}
            onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })}
          />
          <input
            type="text"
            inputMode="numeric"
            aria-label={fieldText("Observation date", "የመረጃው ቀን")}
            placeholder={fieldText("Observation date YYYY-MM-DD *", "የመረጃው ቀን ዓዓዓዓ-ወወ-ቀቀ *")}
            value={draft.observationDate}
            onChange={(e) => setDraft({ ...draft, observationDate: e.target.value })}
          />
          <input
            aria-label={fieldText("Optional note", "ተጨማሪ ማስታወሻ")}
            placeholder={fieldText("Optional note", "ተጨማሪ ማስታወሻ (አማራጭ)")}
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
          />
          <button onClick={handleAdd}>
            <Dual en="Add reviewer-supplied listing" am="የገበያ ማነጻጸሪያ ጨምር" />
          </button>
        </div>
      )}

      {comparables.length < 5 && (
        <p className="unit-entry-note">
          <Dual
            en="Enter each comparable price as a price per single unit."
            am="እያንዳንዱን የማነጻጸሪያ ዋጋ እንደ አንድ እቃ ዋጋ ያስገቡ።"
          />
        </p>
      )}

      {hasError && (
        <p className="form-error" role="alert">
          <Dual
            en="Complete all required fields with a positive unit price, an optional http(s) source URL, and an observation date."
            am="እባክዎ ሁሉንም አስፈላጊ መረጃዎች፣ ትክክለኛ የአንድ እቃ ዋጋ፣ አማራጭ የድረ-ገጽ አገናኝ (URL) እና የመረጃውን ቀን ያስገቡ።"
          />
        </p>
      )}
    </section>
  );
}
