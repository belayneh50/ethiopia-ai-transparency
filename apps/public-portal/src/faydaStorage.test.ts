import { describe, expect, it } from "vitest";
import {
  clearFaydaVerification,
  createFaydaVerification,
  FAYDA_VERIFICATION_KEY,
  FAYDA_VERIFICATION_TTL_MS,
  isCurrentVerification,
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

// Built through the single producer so this fixture always matches the
// validator's contract (the historical bug was producer/validator drift).
const verification: FaydaVerification = createFaydaVerification("user-1", {
  fullName: "Sara Alemu",
  address: "Adama, Oromia",
});

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

  // Regression: verify() once produced expiresAt = verifiedAt + TTL + δ, which
  // the validator rejected, so every fresh verification was wiped on mount.
  it("keeps a fresh verification current — producer and validator agree by construction", () => {
    const session = memoryStorage();
    const fresh = createFaydaVerification("user-1", { fullName: "Sara Alemu", address: "Adama, Oromia" });
    expect(isCurrentVerification(fresh)).toBe(true);
    saveFaydaVerification(session, fresh);
    expect(readFaydaVerification(session)).toEqual(fresh);
  });

  it("uses the shared TTL constant — one owner of the verification lifetime", () => {
    expect(Date.parse(verification.expiresAt) - Date.parse(verification.verifiedAt)).toBe(FAYDA_VERIFICATION_TTL_MS);
  });

  it("treats an expired verification as absent and purges it", () => {
    const session = memoryStorage();
    const expired: FaydaVerification = {
      ...verification,
      verifiedAt: "2026-09-05T10:00:00.000Z",
      expiresAt: "2026-09-05T10:00:01.000Z",
    };
    saveFaydaVerification(session, expired);
    expect(readFaydaVerification(session)).toBeNull();
    expect(session.store.has(FAYDA_VERIFICATION_KEY)).toBe(false);
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
    contactSubjectId: "demo-representative",
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

  it("drops legacy registrations that still carry a raw FIN", () => {
    const local = memoryStorage();
    const legacy = { ...vendor, contactSubjectId: "123456789012", contactFin: "123456789012" };
    saveVendors(local, [vendor, legacy as unknown as VendorRegistration]);
    expect(readVendors(local)).toEqual([vendor]);
  });

  it("returns [] for corrupt payloads instead of throwing", () => {
    const local = memoryStorage();
    local.setItem(VENDOR_KEY, "nope");
    expect(readVendors(local)).toEqual([]);
  });
});
