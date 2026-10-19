import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as recordsApi from './recordsApi';
import { AuditHistory } from './components/AuditHistory';
import { EditRecordModal } from './components/EditRecordModal';
import { isCurrentVerification } from './faydaStorage';
import { Topbar } from "./components/Topbar";
import { SummaryMetrics } from "./components/SummaryMetrics";
import { AuditDashboard } from "./components/AuditDashboard";
import { FaydaVerificationModal } from "./components/FaydaVerificationModal";
import { VendorRegistrationModal } from "./components/VendorRegistrationModal";
import { useFayda } from "./FaydaContext";
import { RecordTable } from "./components/RecordTable";
import { RecordDetailModal } from "./components/RecordDetailModal";
import { AddRecordModal } from "./components/AddRecordModal";
import { ExportAuditModal } from "./components/ExportAuditModal";
import { ThresholdSettingsModal } from "./components/ThresholdSettingsModal";
import { Dual } from "./components/Dual";
import { ShieldNotice } from "./components/ShieldNotice";
import { SettingsProvider, useSettings } from "./SettingsContext";
import type { ThresholdSettings } from "./settings";
import { useAuth } from "./auth/AuthContext";
import { LoginScreen } from "./components/LoginScreen";
import { can, type Capability } from "./auth/roles";
import { createFallbackGuidance, requestGeminiGuidance, type GeminiReviewGuidance } from "./geminiService";
import { calculateMarketReference, resolveRecordQuantity, type ComparableListing } from "./marketReference";
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
  const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
  if (!raw) return initialRecords;
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.length) throw new Error('Browser snapshot has no records. Export and inspect it first.');
  return parsed as RecordItem[];
}
function loadSavedComparables(): Record<string, ComparableListing[]> {
  const raw = localStorage.getItem(STORAGE_KEY_COMPARABLES);
  if (!raw) return initialComparables;
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid browser comparables snapshot.');
  return parsed as Record<string, ComparableListing[]>;
}

export default function App() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [comparablesByRecord, setComparablesByRecord] = useState<Record<string, ComparableListing[]>>({});
  const [language, setLanguage] = useState<Language>("both");
  const [query, setQuery] = useState("");
  const [signalFilter, setSignalFilter] = useState<"all" | "flagged" | SignalKey>("all");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [buyer, setBuyer] = useState("all");
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [faydaModalOpen, setFaydaModalOpen] = useState(false);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [newRecordId, setNewRecordId] = useState<string | null>(null);
  const [geminiGuidance, setGeminiGuidance] = useState<GeminiReviewGuidance | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);

  const { settings, updateSettings } = useSettings();
  const { isAuthenticated, token, user, logout, role, can } = useAuth();
  const { verification } = useFayda();
  // Re-check sessionStorage verification when storage/events change (so the demo checkpoint vanishes after Fayda verifies)
  useEffect(() => {
    const onStorage = () => { const v = window.sessionStorage.getItem('fayda_verification'); if (v) { try { const parsed = JSON.parse(v); if (parsed && parsed.userId === user?.id) { /* verification state handled by FaydaProvider */ } } catch { /* ignore */ } } };
    window.addEventListener('storage', onStorage);
    const interval = window.setInterval(() => {
      const raw = window.sessionStorage.getItem('fayda_verification');
      if (raw) {
        try { const parsed = JSON.parse(raw); if (parsed && parsed.userId === user?.id && parsed.expiresAt && Date.parse(parsed.expiresAt) > Date.now()) { /* refresh verification state */ } } catch { /* ignore */ }
      }
    }, 500);
    return () => { window.removeEventListener('storage', onStorage); window.clearInterval(interval); };
  }, [user]);

  const showEn = language !== "am";
  const showAm = language !== "en";
  const fieldText = (en: string, am: string) =>
    language === "am" ? am : language === "en" ? en : `${en} · ${am}`;

  const openOnlyModal = (modal: "add" | "export" | "settings" | "fayda" | "vendor") => {
    setAddModalOpen(modal === "add");
    setExportModalOpen(modal === "export");
    setSettingsModalOpen(modal === "settings");
    setFaydaModalOpen(modal === "fayda");
    setVendorModalOpen(modal === "vendor");
  };
  const pendingFaydaAction = useRef<{
    action: () => Promise<void>;
    resolve: () => void;
    reject: (error: Error) => void;
  } | null>(null);
  const confirmSensitiveSave = (action: () => Promise<void>) => {
    if (isCurrentVerification(verification)) return action();
    setFaydaModalOpen(true);
    return new Promise<void>((resolve, reject) => {
      pendingFaydaAction.current = { action, resolve, reject };
    });
  };

  const [dataError, setDataError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const epoch = useRef(0);
  const mutationLock = useRef(false);
  useEffect(() => {
    if (!isCurrentVerification(verification) || !pendingFaydaAction.current) return;
    const pending = pendingFaydaAction.current;
    pendingFaydaAction.current = null;
    void pending.action().then(pending.resolve).catch(error => {
      pending.reject(error instanceof Error ? error : new Error('Save failed.'));
    });
  }, [verification]);
  const closeFayda = () => {
    if (pendingFaydaAction.current && !isCurrentVerification(verification)) {
      pendingFaydaAction.current.reject(new Error('Fayda confirmation is required to save.'));
      pendingFaydaAction.current = null;
    }
    setFaydaModalOpen(false);
  };
  const refresh = useCallback(async (updateSelected = false) => {
    const generation = epoch.current;
    const result = await recordsApi.loadRecords(token);
    if (generation !== epoch.current) return;
    setRecords(withComputedSignals(result.records, settings));
    setComparablesByRecord(result.comparables);
    // Background refresh must not silently overwrite an open review draft or its version.
    if (updateSelected) setSelected(current => current ? result.records.find(r => r.id === current.id) ?? null : null);
    setDataError('');
  }, [token, settings]);
  useEffect(() => {
    epoch.current++;
    setRecords([]); setComparablesByRecord({}); setSelected(null); setEditing(null);
    if (!token) return;
    let active = true;
    const reload = () => { void refresh().catch(() => { if (active) setDataError('Database unavailable. Your browser copy is unchanged. · ዳታቤዙ አይገኝም። የአሳሹ ቅጂ አልተቀየረም።'); }); };
    reload(); window.addEventListener('focus', reload);
    return () => { active = false; epoch.current++; window.removeEventListener('focus', reload); };
  }, [token, refresh]);
  const mutate = async (work: () => Promise<unknown>) => {
    if (mutationLock.current) throw new Error('A save is already in progress.');
    mutationLock.current = true; setBusy(true); setDataError('');
    try {
      await work();
      try { await refresh(true); } catch { setDataError('Saved to the database, but refresh failed. Refresh before another edit. · በዳታቤዝ ተቀምጧል፤ ማደስ አልተሳካም። ከሌላ ለውጥ በፊት ያድሱ።'); }
    }
    catch (error) { setDataError(error instanceof Error ? error.message : 'Save failed. · ማስቀመጥ አልተሳካም።'); throw error; }
    finally { mutationLock.current = false; setBusy(false); }
  };

  // Close modals on Escape
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selected) closeDetails();
        else if (addModalOpen) setAddModalOpen(false);
        else if (exportModalOpen) setExportModalOpen(false);
        else if (settingsModalOpen) setSettingsModalOpen(false);
        else if (faydaModalOpen) setFaydaModalOpen(false);
        else if (vendorModalOpen) setVendorModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, addModalOpen, exportModalOpen, settingsModalOpen, faydaModalOpen, vendorModalOpen]);

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

  const handleSaveReview = async (recordId: string, nextStatus: ReviewStatus, nextNote: string) => {
    const record = selected?.id === recordId ? selected : records.find(r => r.id === recordId);
    if (!record || !can('performHumanReview') || !isCurrentVerification(verification)) return;
    try { await mutate(() => recordsApi.saveReview(record, nextStatus, nextNote)); }
    catch { /* retain entered values; error shown above */ }
  };
  const handleResetReviews = () => setDataError('Review history is retained. Change an individual assessment instead. · የግምገማ ታሪክ ይቀመጣል። የእያንዳንዱን ግምገማ ያስተካክሉ።');
  const handleAddRecord = async (data: AddRecordData) => {
    if (!can('addEditRecord')) return;
    await confirmSensitiveSave(async () => {
      await mutate(() => recordsApi.createRecord(data));
      setAddModalOpen(false); resetFilters();
    });
  };
  const handleEditRecord = async (record: RecordItem, data: RecordItem) => {
    if (!can('addEditRecord')) return;
    await confirmSensitiveSave(async () => { await mutate(() => recordsApi.updateRecord(record, data)); });
  };
  const handleThresholdSave = async (next: ThresholdSettings) => {
    await confirmSensitiveSave(async () => { await updateSettings(next); });
  };
  const handleAddComparable = async (listing: ComparableListing) => {
    if (!selected || !can('addVerifyComparable')) return;
    await mutate(() => recordsApi.addComparable(selected, listing)); setGeminiGuidance(null);
  };
  const handleRemoveComparable = async (id: string) => {
    if (!selected || !can('addVerifyComparable')) return;
    try { await mutate(() => recordsApi.removeComparable(selected, id)); setGeminiGuidance(null); } catch { /* error shown above */ }
  };

  const handleAskGemini = async () => {
    if (!selected || geminiLoading || !can('requestGemini') || !isCurrentVerification(verification)) return;
    const comparables = comparablesByRecord[selected.id] || [];
    const recordQuantity = resolveRecordQuantity(selected.item, selected.quantity);
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

  const handleImportSession = async (session: AuditSessionExport) => {
    if (!can('importSession')) throw new Error('Admin import only.');
    await mutate(async () => {
      const result = await recordsApi.importRecords(session);
      setSuccessMessage(fieldText('Imported: ', 'የገቡ: ') + result.imported.length + fieldText(' · Existing IDs skipped unchanged: ', ' · ያሉ መዝገቦች አልተቀየሩም: ') + (result.skipped.join(', ') || '0'));
    });
    resetFilters();
  };
  const importBrowser = async () => {
    try { await handleImportSession({ version: '1.0', appName: 'Browser migration', exportedAt: new Date().toISOString(), records: loadSavedRecords(), comparablesByRecord: loadSavedComparables() }); } catch (error) { setDataError(error instanceof Error ? error.message : 'Import failed'); }
  };

  const selectedComparables = selected ? comparablesByRecord[selected.id] || [] : [];

  return isAuthenticated ? (
    <main className={`lang-${language}`}>
      <Topbar
        language={language}
        onLanguageChange={setLanguage}
        onOpenExportModal={() => openOnlyModal("export")}
        onOpenSettingsModal={() => { if (can('changeThresholds')) openOnlyModal("settings"); }}
        onOpenFaydaModal={() => openOnlyModal("fayda")}
        onOpenVendorModal={() => openOnlyModal("vendor")}
      />

      <section className="database-status collapsible-panel" aria-live="polite" id="database-tools">
        <summary className="collapsible-header">
          <span><Dual en="Shared database · refresh / import" am="የጋራ ዳታቤዝ · ማደስ / ማስገባ" separator="" /></span>
          <span className="collapsible-icon">▼</span>
        </summary>
        <div className="collapsible-body">
          <p><Dual en="Shared local database · refresh to see other users’ changes" am="የጋራ የአካባቢ ዳታቤዝ · የሌሎችን ለውጥ ለማየት ያድሱ" /></p>
          <button disabled={busy} onClick={() => { void refresh().catch(() => setDataError('Refresh failed. · ማደስ አልተሳካም።')); }}><Dual en="Refresh records" am="መዝገቦችን አድስ" /></button>
          {can('importSession') && <><p><Dual en="Import the existing browser copy (or starter samples). Duplicate IDs are skipped; nothing in the browser is erased." am="የአሳሹን ቅጂ (ወይም የመነሻ ናሙናዎችን) ያስገቡ። ተመሳሳይ መለያዎች ይዘለላሉ፤ የአሳሹ መረጃ አይሰረዝም።" /></p>
          <button disabled={busy} onClick={() => void importBrowser()}><Dual en="Import browser copy / samples" am="የአሳሽ ቅጂ / ናሙናዎች አስገባ" /></button></>}
          {dataError && <p role="alert">{dataError}</p>}
          {successMessage && <p>{successMessage}</p>}
        </div>
      </section>
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

      {can('requestGemini') && <AuditDashboard
        language={language}
        records={records}
        onOpenFayda={() => openOnlyModal("fayda")}
      />}

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
        onOpenAddModal={() => openOnlyModal("add")}
        onSelectRecord={openDetails}
        onResetReviews={handleResetReviews}
        canAddRecord={can('addEditRecord')}
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
        />
      )}

      {settingsModalOpen && can('changeThresholds') && (
        <ThresholdSettingsModal
          onClose={() => setSettingsModalOpen(false)}
          onSave={handleThresholdSave}
        />
      )}

      {faydaModalOpen && (
        <FaydaVerificationModal
          language={language}
          onClose={closeFayda}
        />
      )}

      {vendorModalOpen && (
        <VendorRegistrationModal
          language={language}
          onClose={() => setVendorModalOpen(false)}
        />
      )}

      {editing && <EditRecordModal record={editing} onSave={(data) => handleEditRecord(editing, data)} onClose={() => setEditing(null)} />}
      {selected && (
        <RecordDetailModal
          record={selected}
          feedback={dataError}
          onRefresh={() => { void refresh(true).catch(() => setDataError('Refresh failed. · ማደስ አልተሳካም።')); }}
          onEdit={can('addEditRecord') && (role === 'admin' || selected.createdBy === user?.id) ? () => { setEditing(selected); setSelected(null); } : undefined}
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
          onOpenFayda={() => { setSelected(null); openOnlyModal("fayda"); }}
        />
      )}
    </main>
  ) : (
    <LoginScreen language={language} onLanguageChange={setLanguage} />
  );
}
