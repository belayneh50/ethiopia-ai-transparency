import type { RecordItem } from "../types";

type SummaryMetricsProps = {
  records: RecordItem[];
};

export function SummaryMetrics({ records }: SummaryMetricsProps) {
  const total = records.reduce((sum, record) => sum + record.value, 0);
  const flaggedCount = records.filter((r) => r.signals.length > 0).length;
  const formattedCount = records.length < 10 ? `0${records.length}` : `${records.length}`;

  return (
    <section className="summary" aria-label="Summary">
      <div>
        <b>{formattedCount}</b>
        <span>
          <span className="en-only">Sample records</span>
          <small className="am-only">የሙከራ መዝገቦች</small>
        </span>
      </div>
      <div>
        <b>{flaggedCount}</b>
        <span>
          <span className="en-only">Records for review</span>
          <small className="am-only">ለግምገማ የቀረቡ</small>
        </span>
      </div>
      <div>
        <b>03</b>
        <span>
          <span className="en-only">Explainable signals</span>
          <small className="am-only">ግልጽ ምልክቶች</small>
        </span>
      </div>
      <div>
        <b>{(total / 1_000_000).toFixed(2)}M</b>
        <span>
          <span className="en-only">ETB sample value</span>
          <small className="am-only">የሙከራ ጠቅላላ ዋጋ</small>
        </span>
      </div>
    </section>
  );
}
