export type SignalKey = "price" | "repeat" | "delay";

export type Language = "both" | "am" | "en";

export type ReviewStatus = "pending" | "needs-docs" | "under-review" | "no-concern" | "referred";

export type ReviewFilter = "all" | "not-reviewed" | Exclude<ReviewStatus, "pending">;

export type RecordItem = {
  id: string;
  recordId: string;
  item: string;
  itemAm: string;
  category: string;
  categoryAm: string;
  buyer: string;
  supplier: string;
  value: number;
  date: string;
  status: string;
  statusAm: string;
  daysOpen: number;
  bids: number;
  signals: SignalKey[];
  reviewStatus?: ReviewStatus;
  reviewNote?: string;
  reviewDate?: string;
  reviewedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ComparableListing = {
  id?: string;
  recordId?: string;
  item: string;
  itemAm?: string;
  condition: string;
  conditionAm?: string;
  price: number;
  sourceUrl: string;
  observationDate: string;
  note: string;
  noteAm?: string;
  createdAt?: string;
};

export type MarketReferenceSummary = {
  count: number;
  low: number;
  median: number;
  high: number;
  differenceFromMedian: number | null;
  percentFromMedian: number | null;
};

export type AddRecordData = {
  item: string;
  itemAm: string;
  category: string;
  categoryAm: string;
  buyer: string;
  supplier: string;
  value: number;
  bids: number;
  approvalDate: string;
  paymentDate: string;
  status: string;
  statusAm: string;
};

export type ThresholdSettings = {
  price: number;          // ETB
  repeatSupplier: number; // Count
  delay: number;          // Days
};

export type SignalDefinition = {
  label: string;
  am: string;
  short: string;
  shortAm: string;
  detail: string;
  detailAm: string;
  icon: string;
};

export const DEFAULT_SETTINGS: ThresholdSettings = {
  price: 1_500_000,
  repeatSupplier: 2,
  delay: 30,
};

export const SIGNALS: Record<SignalKey, SignalDefinition> = {
  price: {
    label: "Unusually High Price",
    am: "ከባለሙያ ማነጻጸሪያ የመነሻ ዋጋ ከመጠን በላይ ነው",
    short: "High price",
    shortAm: "ከመጠን በላይ ዋጋ",
    detail: "The unit price is notably above the median of comparable listings. An authorized reviewer should verify specifications, quantity, and condition differences.",
    detailAm: "የመያዣ እቃዎቹ ምንጭ ከማነጻጸሪያ የመነሻ ዋጋዎቹ ግምት በላይ ነው። የተቀመጠ ማነጻጸሪያ ዋጋ መስፋፋት እና ዝርዝር ሁኔታዎች ማረጋገጥ አለብን።",
    icon: "💰",
  },
  repeat: {
    label: "Repeat Supplier",
    am: "ይህ አቅራቢ በዚህ አስራ ምንጭ ውስጥ በተመሳሳይ ገዥ ላይ እንደገና ድል አድርጓል",
    short: "Repeat",
    shortAm: "ድጥመት",
    detail: "This supplier has won multiple awards from the same buyer. Reviewers should verify competitive bidding, rotation policies, and conflict-of-interest safeguards.",
    detailAm: "ይህ አቅራቢ ከተመሳሳይ ገዥ በተለያዩ ጊዜዎች ላይ እንደገና ድል አድርጓል። የማንቀሳቀሻ ፖሊሲዎችን፣ የግል ጥቅም ጥየቃዎችን እና የጨረታ ሂደቱን ማረጋገጥ አለብን።",
    icon: "🔁",
  },
  delay: {
    label: "Payment or Approval Delay",
    am: "የጥያቄ ክፍተት ከጥቂት ቀናት በላይ እድሜ አለው",
    short: "Delay",
    shortAm: "ማዘግየት",
    detail: "This record has been open longer than typical processing times. The reviewer should check whether required documents are missing or approvals are pending.",
    detailAm: "ይህ ምዝገባ ከተለመደ የሂደት ጊዜ በላይ ለረዥም ጊዜ ተዘግቷል። የሚያስፈልጉ ሰነዶች የጎደሉ እንደሆነ ወይም ጥያቄዎች በመጠባበቅ ላይ እንደሆነ ማረጋገጥ አለብን።",
    icon: "⏰",
  },
};

export const REVIEW_STATUSES: Record<ReviewStatus, { en: string; am: string }> = {
  pending: { en: "Pending review", am: "ግምገማ በመጠበቅ ላይ" },
  "needs-docs": { en: "Needs supporting documents", am: "ተጨማሪ ሰነዶች ያስፈልጋሉ" },
  "under-review": { en: "Under review", am: "በግምገማ ላይ" },
  "no-concern": { en: "No concern identified", am: "ምንም ስጋት አልተገኘም" },
  referred: { en: "Referred for further review", am: "ለተጨማሪ ግምገማ ተልኳል" },
};

export const REVIEW_FILTER_OPTIONS: { value: ReviewFilter; en: string; am: string }[] = [
  { value: "all", en: "All review states", am: "ሁሉም የግምገማ ሁኔታዎች" },
  { value: "not-reviewed", en: "Not yet reviewed", am: "ገና አልተገመገመም" },
  { value: "needs-docs", en: "Needs documents", am: "ተጨማሪ ሰነድ የሚፈለግ" },
  { value: "under-review", en: "Under review", am: "በግምገማ ላይ" },
  { value: "no-concern", en: "No concern", am: "ስጋት የሌለው" },
  { value: "referred", en: "Referred", am: "ተልኳል" },
];