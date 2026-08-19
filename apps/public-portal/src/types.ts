import type { ReviewStatus } from "./reviewFilter";
import type { ComparableListing } from "./marketReference";

export type SignalKey = "price" | "repeat" | "delay";

export type Language = "both" | "am" | "en";

export type RecordItem = {
  id: string;
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

export type AuditSessionExport = {
  version: "1.0";
  exportedAt: string;
  appName: string;
  records: RecordItem[];
  comparablesByRecord: Record<string, ComparableListing[]>;
};
