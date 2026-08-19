import type { RecordItem, ComparableListing, SignalDefinition, SignalKey } from "./types";

export const initialRecords: RecordItem[] = [
  { id: "SYN-ET-2401", item: "Laptop computers (25)", itemAm: "ላፕቶፕ ኮምፒውተሮች (25)", category: "Technology", categoryAm: "ቴክኖሎጂ", buyer: "Sample Education Office", supplier: "Abay Sample Trading", value: 1785000, date: "18 Jul 2026", status: "Pending approval", statusAm: "ፈቃድ በመጠበቅ ላይ", daysOpen: 42, bids: 4, signals: ["price", "delay"] },
  { id: "SYN-ET-2402", item: "Laptop computers (20)", itemAm: "ላፕቶፕ ኮምፒውተሮች (20)", category: "Technology", categoryAm: "ቴክኖሎጂ", buyer: "Demo Health Office", supplier: "Walia Demo Digital", value: 920000, date: "03 Aug 2026", status: "Paid", statusAm: "ተከፍሏል", daysOpen: 8, bids: 5, signals: [] },
  { id: "SYN-ET-2403", item: "Printer paper (500 boxes)", itemAm: "የማተሚያ ወረቀት (500 ሳጥን)", category: "Office supplies", categoryAm: "የቢሮ ዕቃዎች", buyer: "Sample Roads Unit", supplier: "Abay Sample Trading", value: 640000, date: "25 May 2026", status: "Awaiting payment", statusAm: "ክፍያ በመጠበቅ ላይ", daysOpen: 78, bids: 3, signals: ["repeat", "delay"] },
  { id: "SYN-ET-2404", item: "Water pumps (8)", itemAm: "የውሃ ፓምፖች (8)", category: "Equipment", categoryAm: "መሣሪያዎች", buyer: "Demo Water Office", supplier: "Rift Demo Works", value: 1340000, date: "29 Jul 2026", status: "Paid", statusAm: "ተከፍሏል", daysOpen: 11, bids: 4, signals: [] },
  { id: "SYN-ET-2405", item: "Safety helmets (300)", itemAm: "የደህንነት ቆቦች (300)", category: "Safety", categoryAm: "ደህንነት", buyer: "Sample Roads Unit", supplier: "Abay Sample Trading", value: 510000, date: "10 Aug 2026", status: "Paid", statusAm: "ተከፍሏል", daysOpen: 5, bids: 3, signals: ["repeat"] },
  { id: "SYN-ET-2406", item: "Solar lanterns (150)", itemAm: "የፀሐይ ኃይል ፋኖሶች (150)", category: "Energy", categoryAm: "ኃይል", buyer: "Demo Rural Services", supplier: "Lucy Sample Energy", value: 735000, date: "07 Aug 2026", status: "Pending approval", statusAm: "ፈቃድ በመጠበቅ ላይ", daysOpen: 9, bids: 6, signals: [] },
];

export const initialComparables: Record<string, ComparableListing[]> = {
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

export const signals: Record<SignalKey, SignalDefinition> = {
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

export function withComputedSignals(items: RecordItem[], settings: { price: number; repeatSupplier: number; delay: number }): RecordItem[] {
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
