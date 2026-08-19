export type ComparableListing = {
  id: string;
  item: string;
  itemAm?: string;
  condition: string;
  conditionAm?: string;
  price: number;
  sourceUrl: string;
  observationDate: string;
  note: string;
  noteAm?: string;
};

export type MarketReferenceSummary = {
  count: number;
  low: number;
  median: number;
  high: number;
  differenceFromMedian: number | null;
  percentFromMedian: number | null;
};

export function extractRecordQuantity(item: string): number | null {
  const match = item.match(/\((\d[\d,]*)\)\s*$/);
  if (!match) return null;
  const quantity = Number(match[1].replaceAll(",", ""));
  return Number.isSafeInteger(quantity) && quantity > 0 ? quantity : null;
}

export function calculateMarketReference(listings: ComparableListing[], recordUnitPrice: number | null): MarketReferenceSummary | null {
  if (!listings.length) return null;
  const prices = listings.map(listing => listing.price).sort((a, b) => a - b);
  const middle = Math.floor(prices.length / 2);
  const median = prices.length % 2 ? prices[middle] : (prices[middle - 1] + prices[middle]) / 2;
  const differenceFromMedian = recordUnitPrice === null ? null : recordUnitPrice - median;
  return {
    count: prices.length,
    low: prices[0],
    median,
    high: prices[prices.length - 1],
    differenceFromMedian,
    percentFromMedian: differenceFromMedian === null ? null : (differenceFromMedian / median) * 100,
  };
}
