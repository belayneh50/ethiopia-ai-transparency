import { Dual } from "./Dual";
import { ShieldNotice } from "./ShieldNotice";
import type { GeminiReviewGuidance } from "../geminiService";
import type { MarketReferenceSummary } from "../marketReference";
import type { Language, RecordItem } from "../types";

type GeminiGuidancePanelProps = {
  record: RecordItem;
  language: Language;
  guidance: GeminiReviewGuidance | null;
  loading: boolean;
  unitComparisonAvailable: boolean;
  marketSummary: MarketReferenceSummary | null;
  onAskGemini: () => void;
};

export function GeminiGuidancePanel({
  record,
  language,
  guidance,
  loading,
  unitComparisonAvailable,
  marketSummary,
  onAskGemini,
}: GeminiGuidancePanelProps) {
  return (
    <section className="gemini-review" aria-labelledby="gemini-title">
      <p className="eyebrow">
        <Dual en="OPTIONAL GEMINI GUIDANCE" am="አማራጭ የGEMINI መመሪያ" />
      </p>
      <h3 id="gemini-title">
        <Dual en="Questions for a human reviewer" am="ለሰው ገምጋሚ የቀረቡ ጥያቄዎች" />
      </h3>

      {!guidance && (
        <>
          <p>
            <Dual
              en="If you explicitly continue, the selected synthetic record and the browser-computed unit-price range, explicit quantity, record unit price, and unit-price-to-median comparison will be sent to Google's Gemini API. Listing details, source URLs, dates, and notes stay local and are not sent. Gemini does not know, identify, or search for price sources; it only provides neutral verification questions and does not calculate the range or change signals or status."
              am="በግልጽ ከቀጠሉ የተመረጠው ሰው ሰራሽ መዝገብ፣ በአሳሹ የተሰላው የአንድ እቃ ዋጋ ክልል፣ የተገለጸው ብዛት፣ የመዝገቡ የአንድ እቃ ዋጋ እና ከመካከለኛው የአንድ እቃ ዋጋ ጋር ያለው ማነጻጸሪያ ወደ Google Gemini API ይላካሉ። የዝርዝር መረጃ፣ የምንጭ አገናኞች፣ ቀኖችና ማስታወሻዎች በአካባቢው ይቀራሉ እና አይላኩም። Gemini የዋጋ ምንጮችን አያውቅም፣ አይለይም፣ አይፈልግምም።"
            />
          </p>
          <button
            className="gemini-button"
            onClick={onAskGemini}
            disabled={loading || !unitComparisonAvailable}
          >
            {loading ? (
              <Dual en="Requesting guidance…" am="መመሪያ በመጠየቅ ላይ…" />
            ) : (
              <Dual
                en="Send disclosed record and computed unit range"
                am="የተገለጸውን መዝገብ እና የተሰላውን የዋጋ ክልል ላክ"
              />
            )}
          </button>
          {!unitComparisonAvailable && (
            <small className="gemini-requirement">
              <Dual
                en={
                  marketSummary
                    ? "A verified record quantity is required for per-unit guidance."
                    : "Add at least one valid comparison first."
                }
                am={
                  marketSummary
                    ? "ለአንድ ዕቃ መመሪያ የተረጋገጠ የመዝገብ ብዛት ያስፈልጋል።"
                    : "መጀመሪያ ቢያንስ አንድ ትክክለኛ ማነጻጸሪያ ያክሉ።"
                }
              />
            </small>
          )}
        </>
      )}

      {guidance && (
        <div className="gemini-result" aria-live="polite">
          <span className={`guidance-source ${guidance.source}`}>
            {guidance.source === "gemini" ? (
              <Dual en="Gemini response" am="የGemini ምላሽ" />
            ) : (
              <Dual en="Safe local fallback" am="ደህንነቱ የተጠበቀ የአካባቢ ተተኪ መመሪያ" />
            )}
          </span>
          <p className="en-only">{guidance.overviewEn}</p>
          <p className="am-copy am-only">{guidance.overviewAm}</p>
          <ol className="en-only">
            {guidance.questionsEn.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
          <ol className="am-copy am-only">
            {guidance.questionsAm.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
          <p className="guidance-limit en-only">{guidance.limitationsEn}</p>
          <p className="guidance-limit am-copy am-only">{guidance.limitationsAm}</p>
          <ShieldNotice />
        </div>
      )}
    </section>
  );
}
