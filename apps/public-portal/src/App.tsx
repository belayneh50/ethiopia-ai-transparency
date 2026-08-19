import { useEffect, useMemo, useState } from "react";
import { Topbar } from "./components/Topbar";
import { SummaryMetrics } from "./components/SummaryMetrics";
import { RecordTable } from "./components/RecordTable";
import { RecordDetailModal } from "./components/RecordDetailModal";
import { AddRecordModal } from "./components/AddRecordModal";
import { ExportAuditModal } from "./components/ExportAuditModal";
import { ThresholdSettingsModal } from "./components/ThresholdSettingsModal";
import { Dual } from "./components/Dual";
import { ShieldNotice } from "./components/ShieldNotice";
import { SettingsProvider, useSettings } from "./SettingsContext";
import { createFallbackGuidance, requestGeminiGuidance, type GeminiReviewGuidance } from "./geminiService";
import { calculateMarketReference, extractRecordQuantity, type ComparableListing } from "./marketReference";
import { matchesReviewFilter, type ReviewFilter, type ReviewStatus } from "./reviewFilter";
import type { AddRecordData, AuditSessionExport, Language, RecordItem, SignalDefinition, SignalKey } from "./types";

const STORAGE_KEY_RECORDS = "ethiopia_ai_transparency_records_v1";
const STORAGE_KEY_COMPARABLES = "ethiopia_ai_transparency_comparables_v1";

const initialRecords: RecordItem[] = [
  { id: "SYN-ET-2401", item: "Laptop computers (25)", itemAm: "ላፕቶፕ ኮምፒውተሮች (25)", category: "Technology", categoryAm: "ቴክኖሎጂ", buyer: "Sample Education Office", supplier: "Abay Sample Trading", value: 1785000, date: "18 Jul 2026", status: "Pending approval", statusAm: "ፈቃድ በመጠበቅ ላይ", daysOpen: 42, bids: 4, signals: ["price", "delay"] },
  { id: "SYN-ET-2402", item: "Laptop computers (20)", itemAm: "ላፕቶፕ ኮምፒውተሮች (20)", category: "Technology", categoryAm: "ቴክኖሎጂ", buyer: "Demo Health Office", supplier: "Walia Demo Digital", value: 920000, date: "03 Aug 2026", status: "Paid", statusAm: "ተከፍሏል", daysOpen: 8, bids: 5, signals: [] },
  { id: "SYN-ET-2403", item: "Printer paper (500 boxes)", itemAm: "የማተሚያ ወረቀት (500 ሳጥን)", category: "Office supplies", categoryAm: "የቢሮ ዕቃዎች", buyer: "Sample Roads Unit", supplier: "Abay Sample Trading", value: 640000, date: "25 May 2026", status: "Awaiting payment", statusAm: "ክፍያ በመጠበቅ ላይ", daysOpen: 78, bids: 3, signals: ["repeat", "delay"] },
  { id: "SYN-ET-2404", item: "Water pumps (8)", itemAm: "የውሃ ፓምፖች (8)", category: "Equipment", categoryAm: "መሣሪያዎች", buyer: "Demo Water Office", supplier: "Rift Demo Works", value: 1340000, date: "29 Jul 2026", status: "Paid", statusAm: "ተከፍሏል", daysOpen: 11, bids: 4, signals: [] },
  { id: "SYN-ET-2405", item: "Safety helmets (300)", itemAm: "የደህንነት ቆቦች (300)", category: "Safety", categoryAm: "ደህንነት", buyer: "Sample Roads Unit", supplier: "Abay Sample Trading", value: 510000, date: "10 Aug 2026", status: "Paid", statusAm: "ተከፍሏል", daysOpen: 5, bids: 3, signals: ["repeat"] },
  { id: "SYN-ET-2406", item: "Solar lanterns (150)", itemAm: "የፀሐይ ኃይል ፋኖሶች (150)", category: "Energy", categoryAm: "ኃይል", buyer: "Demo Rural Services", supplier: "Lucy Sample Energy", value: 735000, date: "07 Aug 2026", status: "Pending approval", statusAm: "ፈቃድ በመጠበቅ ላይ", daysOpen: 9, bids: 6, signals: [] },
];

const initialComparables: Record<string, ComparableListing[]> = {
  "SYN-ET-2402": [
    {
      id: "synthetic-example-2402",
      item: "Synthetic comparable laptop unit",
      itemAm: "ሰው ሰራሽ የላፕቶፕ ማነጻጸሪያ እቃ",
      condition: "Synthetic new condition",
      conditionAm: "ሰው ሰራሽ አዲስ ሁኔታ",
      price: 51000,
      sourceUrl: "https://example.com/synthetic-laptop-unit",
      observationDate: "2026-08-12",
      note: "Fictional reviewer-supplied example for local demonstration only.",
      noteAm: "ለአካባቢ ማሳያ ብቻ በገምጋሚ የቀረበ ምናባዊ ምሳሌ።",
    },
  ],
};

const signals: Record<SignalKey, SignalDefinition> = {
  price: {
    label: "Comparative price",
    am: "ከፍተኛ የንጽጽር ዋጋ",
    short: "High price",
    shortAm: "ከፍተኛ ዋጋ",
    detail: "The unit price is 55% above the median of comparable laptop records in this synthetic dataset.",
    detailAm: "የአንዱ እቃ ዋጋ በዚህ የሙከራ መረጃ ውስጥ ካሉ ተመሳሳይ የላፕቶፕ መዝገቦች መካከለኛ ዋጋ በ55% ከፍ ያለ ነው።",
    icon: "↗",
  },
  repeat: {
    label: "Repeated supplier wins",
    am: "ተደጋጋሚ የውል አሸናፊነት",
    short: "Repeat wins",
    shortAm: "ተደጋጋሚ አሸናፊ",
    detail: "This synthetic supplier appears in 3 of 6 recent sample awards across the demo buyers.",
    detailAm: "ይህ አቅራቢ ከ6 የሙከራ ውሎች ውስጥ በ3ቱ አሸናፊ ሆኖ ተመርጧል።",
    icon: "↻",
  },
  delay: {
    label: "Approval or payment delay",
    am: "የማጽደቅ ወይም የክፍያ መዘግየት",
    short: "Overdue delay",
    shortAm: "የዘገየ ሂደት",
    detail: "Approval or payment remains open beyond the demo review threshold of 30 days.",
    detailAm: "የውሳኔ ማጽደቅ ወይም ክፍያ ከ30 ቀናት የማሳያ ገደብ በላይ ክፍት ሆኖ ቆይቷል።",
    icon: "◷",
  },
};

function withComputedSignals(items: RecordItem[], settings: { price: number; repeatSupplier: number; delay: number }): RecordItem[] {
  const supplierCounts = new Map<string, number>();
  for (const item of items) {
    supplierCounts.set(item.supplier, (supplierCounts.get(item.supplier) ?? 0) + 1);
  }
  return items.map((item) => {
    const computed: SignalKey[] = [];
    if (item.value > settings.price) computed.push("price");
    if ((supplierCounts.get(item.supplier) ?? 0) >= settings.repeatSupplier) computed.push("repeat");
    if (item.daysOpen > settings.delay) computed.push("delay");
    return { ...item, signals: computed };
  });
}

function loadSavedRecords(): RecordItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    // ignore
  }
  return initialRecords;
}

function loadSavedComparables(): Record<string, ComparableListing[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPARABLES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    // ignore
  }
  return initialComparables;
}

export default function App() {
  const [records, setRecords] = useState<RecordItem[]>(loadSavedRecords);
  const [comparablesByRecord, setComparablesByRecord] = useState<Record<string, ComparableListing[]>>(loadSavedComparables);
  const [language, setLanguage] = useState<Language>("both");
  const [query, setQuery] = useState("");
  const [signalFilter, setSignalFilter] = useState<"all" | "flagged" | SignalKey>("all");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [buyer, setBuyer] = useState("all");
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [newRecordId, setNewRecordId] = useState<string | null>(null);
  const [geminiGuidance, setGeminiGuidance] = useState<GeminiReviewGuidance | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);

  const { settings } = useSettings();

  const showEn = language !== "am";
  const showAm = language !== "en";
  const fieldText = (en: string, am: string) =>
    language === "am" ? am : language === "en" ? en : `${en} · ${am}`;

  // Persist session changes to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch {
      // ignore quota errors
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPARABLES, JSON.stringify(comparablesByRecord));
    } catch {
      // ignore
    }
  }, [comparablesByRecord]);

  // Close modals on Escape
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selected) closeDetails();
        else if (addModalOpen) setAddModalOpen(false);
        else if (exportModalOpen) setExportModalOpen(false);
        else if (settingsModalOpen) setSettingsModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, addModalOpen, exportModalOpen, settingsModalOpen]);

  const visibleRecords = useMemo(() => {
    return records.filter((record) => {
      const haystack = Object.values(record).join(" ").toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesBuyer = buyer === "all" || record.buyer === buyer;
      const matchesSignal =
        signalFilter === "all" ||
        (signalFilter === "flagged"
          ? record.signals.length > 0
          : record.signals.includes(signalFilter));
      const matchesReview = matchesReviewFilter(record, reviewFilter);
      return matchesQuery && matchesBuyer && matchesSignal && matchesReview;
    });
  }, [records, query, buyer, signalFilter, reviewFilter]);

  const resetFilters = () => {
    setQuery("");
    setBuyer("all");
    setSignalFilter("all");
    setReviewFilter("all");
  };

  const closeDetails = () => {
    setSelected(null);
    setGeminiGuidance(null);
    setGeminiLoading(false);
  };

  const openDetails = (record: RecordItem) => {
    setSelected(record);
    setGeminiGuidance(null);
  };

  const handleSaveReview = (recordId: string, nextStatus: ReviewStatus, nextNote: string) => {
    if (nextStatus === "pending") return;
    const reviewDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const update = (record: RecordItem): RecordItem =>
      record.id === recordId
        ? { ...record, reviewStatus: nextStatus, reviewNote: nextNote.trim(), reviewDate }
        : record;

    setRecords((current) => current.map(update));
    setSelected((current) => (current ? update(current) : null));
  };

  const handleResetReviews = () => {
    const message = fieldText(
      "Reset all local reviews? This will clear human review assessments.",
      "ሁሉንም የአካባቢ ግምገማዎች ዳግም ይጀምሩ? ይህ የሰው ግምገማዎችን ያጸዳል።"
    );
    if (!window.confirm(message)) return;
    const clearReview = (record: RecordItem): RecordItem => ({
      ...record,
      reviewStatus: undefined,
      reviewNote: undefined,
      reviewDate: undefined,
    });
    setRecords((current) => current.map(clearReview));
    setSelected((current) => (current ? clearReview(current) : null));
    setReviewFilter("all");
  };

  const handleAddRecord = (formData: AddRecordData) => {
    const approval = new Date(`${formData.approvalDate}T00:00:00`);
    const payment = formData.paymentDate ? new Date(`${formData.paymentDate}T00:00:00`) : null;
    const elapsedEnd = formData.status === "Paid" && payment ? payment : new Date();
    const daysOpen = Math.max(0, Math.floor((elapsedEnd.getTime() - approval.getTime()) / 86_400_000));

    let sequence = 2401;
    while (records.some((record) => record.id === `SYN-ET-${sequence}`)) {
      sequence += 1;
    }
    const newId = `SYN-ET-${sequence}`;

    const newRecord: RecordItem = {
      id: newId,
      item: formData.item,
      itemAm: formData.itemAm,
      category: formData.category,
      categoryAm: formData.categoryAm,
      buyer: formData.buyer,
      supplier: formData.supplier,
      value: formData.value,
      date: approval.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: formData.status,
      statusAm: formData.statusAm,
      daysOpen,
      bids: formData.bids,
      signals: [],
    };

    setRecords((current) => withComputedSignals([...current, newRecord], settings));
    resetFilters();
    setAddModalOpen(false);
    setNewRecordId(newId);

    window.setTimeout(() => {
      setSuccessMessage(
        fieldText(
          "Synthetic sample record added — pending authorized human review.",
          "የሙከራ መዝገብ ታክሏል — ፈቃድ ያለው የሰው ግምገማ በመጠበቅ ላይ።"
        )
      );
      document.getElementById("records")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    window.setTimeout(() => setSuccessMessage(""), 5000);
    window.setTimeout(() => setNewRecordId(null), 3000);
  };

  const handleAddComparable = (listing: ComparableListing) => {
    if (!selected) return;
    setComparablesByRecord((current) => ({
      ...current,
      [selected.id]: [...(current[selected.id] || []), listing],
    }));
    setGeminiGuidance(null);
  };

  const handleRemoveComparable = (id: string) => {
    if (!selected) return;
    setComparablesByRecord((current) => ({
      ...current,
      [selected.id]: (current[selected.id] || []).filter((l) => l.id !== id),
    }));
    setGeminiGuidance(null);
  };

  const handleAskGemini = async () => {
    if (!selected || geminiLoading) return;
    const comparables = comparablesByRecord[selected.id] || [];
    const recordQuantity = extractRecordQuantity(selected.item);
    const recordUnitPrice = recordQuantity ? selected.value / recordQuantity : null;
    const marketSummary = calculateMarketReference(comparables, recordUnitPrice);

    if (
      !marketSummary ||
      !recordQuantity ||
      recordUnitPrice === null ||
      marketSummary.differenceFromMedian === null ||
      marketSummary.percentFromMedian === null
    ) {
      return;
    }

    setGeminiLoading(true);
    try {
      const guidance = await requestGeminiGuidance({
        language,
        id: selected.id,
        item: selected.item,
        category: selected.category,
        buyer: selected.buyer,
        supplier: selected.supplier,
        value: selected.value,
        date: selected.date,
        status: selected.status,
        daysOpen: selected.daysOpen,
        bids: selected.bids,
        signals: selected.signals,
        marketReference: {
          ...marketSummary,
          recordQuantity,
          recordUnitPrice,
          differenceFromMedian: marketSummary.differenceFromMedian,
          percentFromMedian: marketSummary.percentFromMedian,
        },
      });
      setGeminiGuidance(guidance);
    } catch {
      setGeminiGuidance(createFallbackGuidance(language));
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleImportSession = (session: AuditSessionExport) => {
    if (session.records && Array.isArray(session.records)) {
      setRecords(withComputedSignals(session.records, settings));
    }
    if (session.comparablesByRecord && typeof session.comparablesByRecord === "object") {
      setComparablesByRecord(session.comparablesByRecord);
    }
    resetFilters();
  };

  const handleResetToDefaults = () => {
    setRecords(initialRecords);
    setComparablesByRecord(initialComparables);
    localStorage.removeItem(STORAGE_KEY_RECORDS);
    localStorage.removeItem(STORAGE_KEY_COMPARABLES);
    resetFilters();
  };

  const selectedComparables = selected ? comparablesByRecord[selected.id] || [] : [];

  return (
    <main className={`lang-${language}`}>
      <Topbar
        language={language}
        onLanguageChange={setLanguage}
        onOpenExportModal={() => setExportModalOpen(true)}
        onOpenSettingsModal={() => setSettingsModalOpen(true)}
      />

      <section className="hero" id="top">
        <div className="hero-content">
          <p className="eyebrow hero-label">
            <span className="eyebrow-line" aria-hidden="true"></span>
            <Dual en="SYNTHETIC PROCUREMENT REVIEW" am="ሰው ሰራሽ የግዥ ግምገማ" />
          </p>
          {showEn && (
            <h1>
              See the signal.
              <br />
              <em>Review the context.</em>
            </h1>
          )}
          {showAm && (
            <h2 className="am-title">
              ምልክቱን ይመልከቱ።
              <br />
              <em>ዐውዱን ይገምግሙ።</em>
            </h2>
          )}
          <p className="lede">
            {showEn && "A clear, explainable view of sample procurement activity."}
            {showEn && showAm && <br />}
            {showAm && "የሙከራ ግዥ እንቅስቃሴን ግልጽ በሆነ መንገድ ለመመልከት።"}
          </p>
        </div>
      </section>

      <SummaryMetrics records={records} />

      <RecordTable
        records={records}
        visibleRecords={visibleRecords}
        language={language}
        query={query}
        buyer={buyer}
        signalFilter={signalFilter}
        reviewFilter={reviewFilter}
        newRecordId={newRecordId}
        successMessage={successMessage}
        signalsMap={signals}
        onQueryChange={setQuery}
        onBuyerChange={setBuyer}
        onSignalFilterChange={setSignalFilter}
        onReviewFilterChange={setReviewFilter}
        onResetFilters={resetFilters}
        onOpenAddModal={() => setAddModalOpen(true)}
        onSelectRecord={openDetails}
        onResetReviews={handleResetReviews}
      />

      <section className="method" id="method">
        <div className="method-intro">
          <p className="eyebrow">
            <Dual en="HOW TO READ THE SIGNALS" am="ምልክቶቹን እንዴት ማንበብ እንደሚቻል" />
          </p>
          <h2>
            <span className="en-only">
              Prompts for review,
              <br />
              <em>not verdicts.</em>
            </span>
            <span className="am-only">
              የግምገማ ምልክቶች፣
              <br />
              <em>ውሳኔዎች አይደሉም።</em>
            </span>
          </h2>
          <p>
            <Dual
              en="Simple rules make each signal traceable. Context and source documents must always be checked by an authorized reviewer."
              am="ቀላል ህጎች እያንዳንዱን ምልክት ለመከታተል ያስችላሉ። ዐውድና የግዥ መነሻ ሰነዶች ሁልጊዜ ፈቃድ ባለው ገምጋሚ መረጋገጥ አለባቸው።"
            />
          </p>
        </div>
        <div className="signal-cards">
          {(Object.keys(signals) as SignalKey[]).map((key, index) => (
            <article key={key}>
              <header>
                <span className={`signal-icon ${key}`}>{signals[key].icon}</span>
                <small>0{index + 1}</small>
              </header>
              <h3>
                <span className="en-only">{signals[key].label}</span>
                <span className="am-only">{signals[key].am}</span>
              </h3>
              <p className="en-only">{signals[key].detail}</p>
              <p className="am-only">{signals[key].detailAm}</p>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <div className="brand">
          <span className="brand-mark">ግ</span>
          <span>
            <b>ግልጽ ግዥ</b>
            <small>Clear procurement</small>
          </span>
        </div>
        <p>
          <Dual
            en="Authorized human review only. Signals are not proof of wrongdoing."
            am="ፈቃድ ላለው የሰው ግምገማ ብቻ። ምልክቶች የጥፋተኝነት ማስረጃ አይደሉም።"
            separator=""
          />
        </p>
      </footer>

      {addModalOpen && (
        <AddRecordModal
          onClose={() => setAddModalOpen(false)}
          onSubmit={handleAddRecord}
          language={language}
        />
      )}

      {exportModalOpen && (
        <ExportAuditModal
          records={records}
          comparablesByRecord={comparablesByRecord}
          language={language}
          onClose={() => setExportModalOpen(false)}
          onImportSession={handleImportSession}
          onResetToDefaults={handleResetToDefaults}
        />
      )}

      {settingsModalOpen && (
        <ThresholdSettingsModal
          onClose={() => setSettingsModalOpen(false)}
        />
      )}

      {selected && (
        <RecordDetailModal
          record={selected}
          language={language}
          signalsMap={signals}
          comparables={selectedComparables}
          guidance={geminiGuidance}
          guidanceLoading={geminiLoading}
          onClose={closeDetails}
          onSaveReview={handleSaveReview}
          onAddComparable={handleAddComparable}
          onRemoveComparable={handleRemoveComparable}
          onAskGemini={handleAskGemini}
        />
      )}
    </main>
  );
}
