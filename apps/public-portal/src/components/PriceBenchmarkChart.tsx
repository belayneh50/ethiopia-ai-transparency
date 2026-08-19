import { Dual } from "./Dual";
import type { Language } from "../types";

const money = new Intl.NumberFormat("en-US");

type PriceBenchmarkChartProps = {
  low: number;
  median: number;
  high: number;
  recordUnitPrice: number;
  differenceFromMedian: number;
  percentFromMedian: number;
  language: Language;
};

export function PriceBenchmarkChart({
  low,
  median,
  high,
  recordUnitPrice,
  differenceFromMedian,
  percentFromMedian,
  language,
}: PriceBenchmarkChartProps) {
  // Determine overall range bounds with safety padding
  const minBound = Math.min(low, recordUnitPrice);
  const maxBound = Math.max(high, recordUnitPrice);
  const spread = maxBound - minBound || 1;

  // Normalized percentage positions (clamped between 6% and 94% for visual pin and markers)
  const toPercent = (val: number) => {
    if (maxBound === minBound) return 50;
    const raw = ((val - minBound) / spread) * 100;
    return Math.max(6, Math.min(94, raw));
  };

  const lowPos = toPercent(low);
  const medianPos = toPercent(median);
  const highPos = toPercent(high);
  const recordPos = toPercent(recordUnitPrice);

  const isAboveMedian = differenceFromMedian > 0;
  const isAboveHigh = recordUnitPrice > high;
  const isBelowLow = recordUnitPrice < low;
  const isSingleListingOrFlat = low === high;

  const statusClass = isAboveHigh
    ? "benchmark-above-high"
    : isAboveMedian
    ? "benchmark-above-median"
    : isBelowLow
    ? "benchmark-below-low"
    : "benchmark-within-range";

  const diffFormatted = money.format(Math.abs(differenceFromMedian));
  const percentFormatted = Math.abs(percentFromMedian).toFixed(1);

  return (
    <div className={`price-benchmark-card ${statusClass}`} role="region" aria-label="Visual Market Price Benchmark">
      <div className="benchmark-header">
        <span className="benchmark-title">
          <Dual en="Visual Price Benchmark Gauge" am="የገበያ ዋጋ ንጽጽር መለኪያ" />
        </span>
        <span className={`benchmark-badge ${isAboveMedian ? "badge-high" : "badge-normal"}`}>
          {isAboveMedian ? "▲" : isBelowLow ? "▼" : "●"} {percentFormatted}%{" "}
          {isAboveMedian ? (
            <Dual en="above median" am="ከመካከለኛው ዋጋ በላይ" />
          ) : differenceFromMedian < 0 ? (
            <Dual en="below median" am="ከመካከለኛው ዋጋ በታች" />
          ) : (
            <Dual en="equal to median" am="ከመካከለኛው ጋር እኩል" />
          )}
        </span>
      </div>

      <div className="benchmark-track-container">
        {/* Track bar */}
        <div className="benchmark-track">
          {/* Observed range shaded region */}
          {!isSingleListingOrFlat ? (
            <div
              className="benchmark-range-fill"
              style={{
                left: `${Math.min(lowPos, highPos)}%`,
                width: `${Math.max(4, Math.abs(highPos - lowPos))}%`,
              }}
              title="Observed market comparison range"
            />
          ) : (
            <div
              className="benchmark-single-point"
              style={{ left: `${medianPos}%` }}
              title={`Single market reference: ETB ${money.format(median)}`}
            />
          )}

          {/* Median benchmark marker */}
          <div
            className="benchmark-median-line"
            style={{ left: `${medianPos}%` }}
            title={`Market Median: ETB ${money.format(median)}`}
          />

          {/* Record unit price pin */}
          <div
            className="benchmark-record-pin"
            style={{ left: `${recordPos}%` }}
            tabIndex={0}
            aria-label={`Record unit price: ETB ${money.format(recordUnitPrice)}`}
          >
            <div className="pin-flag">
              <span className="pin-label">
                <Dual en="Record Unit Price" am="የመዝገቡ የአንድ እቃ ዋጋ" />
              </span>
              <strong>ETB {money.format(recordUnitPrice)}</strong>
            </div>
            <div className="pin-arrow" />
            <div className="pin-dot" />
          </div>
        </div>

        {/* Clean, non-colliding reference legend */}
        <div className="benchmark-legend-grid">
          {isSingleListingOrFlat ? (
            <div className="legend-item legend-median-only">
              <span className="legend-tag tag-median">
                <Dual en="Market Reference Price (Single)" am="የቀረበው የገበያ ዋጋ (አንድ ማነጻጸሪያ)" />
              </span>
              <strong>ETB {money.format(median)}</strong>
            </div>
          ) : (
            <>
              <div className="legend-item">
                <span className="legend-tag tag-low">
                  <Dual en="Low" am="ዝቅተኛ ዋጋ" />
                </span>
                <strong>ETB {money.format(low)}</strong>
              </div>

              <div className="legend-item legend-median-item">
                <span className="legend-tag tag-median">
                  <Dual en="Median" am="መካከለኛ ዋጋ" />
                </span>
                <strong>ETB {money.format(median)}</strong>
              </div>

              <div className="legend-item">
                <span className="legend-tag tag-high">
                  <Dual en="High" am="ከፍተኛ ዋጋ" />
                </span>
                <strong>ETB {money.format(high)}</strong>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="benchmark-footer-note">
        <span className="info-icon">ℹ</span>
        <p>
          <Dual
            en={`Record unit price is ETB ${diffFormatted} (${percentFormatted}%) ${
              isAboveMedian ? "above" : "below"
            } the reviewer-entered median.`}
            am={`የመዝገቡ የአንድ እቃ ዋጋ በገምጋሚው ከገባው መካከለኛ ዋጋ በETB ${diffFormatted} (${percentFormatted}%) ${
              isAboveMedian ? "በላይ" : "በታች"
            } ነው።`}
          />
          {isAboveHigh && (
            <span className="highlight-warning">
              {" "}
              · <Dual en="Above highest entered listing." am="ከተመዘገበው ከፍተኛ ዋጋ በላይ።" />
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
