import { describe, expect, it } from "vitest";
import {
  clearFaydaVerification,
  FAYDA_VERIFICATION_KEY,
  readFaydaVerification,
  readVendors,
  saveFaydaVerification,
  saveVendors,
  VENDOR_KEY,
  type FaydaVerification,
  type VendorRegistration,
} from "./faydaStorage";
import type { SimpleStorage } from "./faydaStorage";

function memoryStorage(): SimpleStorage & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (key) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

const verification: FaydaVerification = {
  fin: "123456789012",
  fullName: "Sara Alemu",
  address: "Adama, Oromia",
  verifiedAt: "2026-09-05T10:00:00.000Z",
};

describe("fayda verification storage", () => {
  it("round-trips a verified identity through sessionStorage only", () => {
    const session = memoryStorage();
    const local = memoryStorage();
    expect(readFaydaVerification(session)).toBeNull();

    saveFaydaVerification(session, verification);
    expect(readFaydaVerification(session)).toEqual(verification);
    expect(session.store.has(FAYDA_VERIFICATION_KEY)).toBe(true);
    // Never touches localStorage.
    expect(local.store.size).toBe(0);
  });

  it("clears the verified identity", () => {
    const session = memoryStorage();
    saveFaydaVerification(session, verification);
    clearFaydaVerification(session);
    expect(readFaydaVerification(session)).toBeNull();
  });

  it("returns null for corrupt or missing payloads instead of throwing", () => {
    const session = memoryStorage();
    session.setItem(FAYDA_VERIFICATION_KEY, "{not-json");
    expect(readFaydaVerification(session)).toBeNull();
  });
});

describe("vendor registration storage", () => {
  const vendor: VendorRegistration = {
    id: "VND-1",
    company: "Abay Sample Trading",
    contactName: "Sara Alemu",
    contactFin: "123456789012",
    verifiedAt: "2026-09-05T10:00:00.000Z",
    registeredAt: "2026-09-05T10:05:00.000Z",
  };

  it("starts empty and persists registrations in localStorage", () => {
    const local = memoryStorage();
    expect(readVendors(local)).toEqual([]);

    saveVendors(local, [vendor]);
    expect(readVendors(local)).toEqual([vendor]);
    expect(local.store.has(VENDOR_KEY)).toBe(true);
  });

  it("keeps the bid-submitted flag on the stored registration", () => {
    const local = memoryStorage();
    saveVendors(local, [vendor]);
    const next = readVendors(local).map((v) => ({
      ...v,
      bidSubmittedAt: "2026-09-05T10:10:00.000Z",
    }));
    saveVendors(local, next);
    expect(readVendors(local)[0].bidSubmittedAt).toBe("2026-09-05T10:10:00.000Z");
  });

  it("returns [] for corrupt payloads instead of throwing", () => {
    const local = memoryStorage();
    local.setItem(VENDOR_KEY, "nope");
    expect(readVendors(local)).toEqual([]);
  });
});