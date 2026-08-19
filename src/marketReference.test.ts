import { describe, expect, it } from "vitest";
import {
  calculateMarketReference,
  extractRecordQuantity,
  type ComparableListing,
} from "./marketReference";

describe("extractRecordQuantity", () => {
  it("extracts simple integer quantities from parentheses", () => {
    expect(extractRecordQuantity("Laptop computers (25)")).toBe(25);
    expect(extractRecordQuantity("Water pumps (8)")).toBe(8);
  });

  it("extracts comma-formatted numbers correctly", () => {
    expect(extractRecordQuantity("Safety helmets (1,500)")).toBe(1500);
    expect(extractRecordQuantity("Printer paper (10,000 boxes)")).toBeNull(); // not ending with purely digits
  });

  it("returns null when no explicit quantity pattern is matched", () => {
    expect(extractRecordQuantity("Consulting services")).toBeNull();
    expect(extractRecordQuantity("Office chairs (none)")).toBeNull();
    expect(extractRecordQuantity("Desktop PC (0)")).toBeNull();
  });
});

describe("calculateMarketReference", () => {
  const sampleListings: ComparableListing[] = [
    {
      id: "1",
      item: "Listing 1",
      condition: "New",
      price: 50000,
      sourceUrl: "https://example.com/1",
      observationDate: "2026-08-01",
      note: "",
    },
    {
      id: "2",
      item: "Listing 2",
      condition: "New",
      price: 60000,
      sourceUrl: "https://example.com/2",
      observationDate: "2026-08-02",
      note: "",
    },
    {
      id: "3",
      item: "Listing 3",
      condition: "New",
      price: 70000,
      sourceUrl: "https://example.com/3",
      observationDate: "2026-08-03",
      note: "",
    },
  ];

  it("returns null for empty listings", () => {
    expect(calculateMarketReference([], 55000)).toBeNull();
  });

  it("calculates low, median, and high for odd length listings", () => {
    const result = calculateMarketReference(sampleListings, 66000);
    expect(result).not.toBeNull();
    expect(result?.count).toBe(3);
    expect(result?.low).toBe(50000);
    expect(result?.median).toBe(60000);
    expect(result?.high).toBe(70000);
    expect(result?.differenceFromMedian).toBe(6000); // 66000 - 60000
    expect(result?.percentFromMedian).toBe(10); // 6000 / 60000 * 100
  });

  it("calculates median correctly for even length listings (mean of 2 middle items)", () => {
    const evenListings = [
      ...sampleListings,
      {
        id: "4",
        item: "Listing 4",
        condition: "New",
        price: 80000,
        sourceUrl: "https://example.com/4",
        observationDate: "2026-08-04",
        note: "",
      },
    ];
    const result = calculateMarketReference(evenListings, 65000);
    expect(result).not.toBeNull();
    expect(result?.count).toBe(4);
    expect(result?.low).toBe(50000);
    expect(result?.high).toBe(80000);
    expect(result?.median).toBe(65000); // (60000 + 70000) / 2
    expect(result?.differenceFromMedian).toBe(0);
    expect(result?.percentFromMedian).toBe(0);
  });

  it("handles null recordUnitPrice gracefully", () => {
    const result = calculateMarketReference(sampleListings, null);
    expect(result).not.toBeNull();
    expect(result?.differenceFromMedian).toBeNull();
    expect(result?.percentFromMedian).toBeNull();
  });
});
