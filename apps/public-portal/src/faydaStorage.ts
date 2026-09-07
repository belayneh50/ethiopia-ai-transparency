// Pure storage rules for the Fayda eKYC demo — no window/DOM access, so they
// are unit-testable in the plain node Vitest environment (faydaStorage.test.ts).
//
// Contract locked here:
//  - the verified identity lives in sessionStorage ONLY: a fresh window or a
//    fresh browser session starts unverified (matching the auth semantics),
//    while a same-tab reload keeps the verified identity;
//  - vendor registrations are Fayda-gated demo data and live in localStorage
//    (they are demo records, like the records/comparables keys);
//  - nothing else in storage is ever read, written, or removed.

import { FAYDA_TOKEN_TTL_SECONDS } from './services/faydaService';

export const FAYDA_VERIFICATION_KEY = 'ethiopia_ai_fayda_verification_v1';
export const VENDOR_KEY = 'ethiopia_ai_vendors_v1';

/** Single owner of the verification lifetime — producer and validator share it. */
export const FAYDA_VERIFICATION_TTL_MS = FAYDA_TOKEN_TTL_SECONDS * 1_000;

/**
 * Build a verification whose lifetime is correct by construction: the same
 * constant feeds the validator below, so a fresh verification is always
 * current (the historical bug was an off-by-δ mismatch between the two).
 */
export function createFaydaVerification(
  userId: string,
  minimalData: { fullName: string; address: string },
): FaydaVerification {
  const verifiedAtMs = Date.now();
  return {
    subjectId: 'demo-representative',
    userId,
    fullName: minimalData.fullName,
    address: minimalData.address,
    verifiedAt: new Date(verifiedAtMs).toISOString(),
    expiresAt: new Date(verifiedAtMs + FAYDA_VERIFICATION_TTL_MS).toISOString(),
  };
}

export type FaydaVerification = {
  subjectId: string;
  userId: string;
  expiresAt: string;
  fullName: string;
  address: string;
  verifiedAt: string;
};

export type VendorRegistration = {
  id: string;
  company: string;
  contactName: string;
  contactSubjectId: string;
  verifiedAt: string;
  registeredAt: string;
  bidSubmittedAt?: string;
};

// Minimal Storage surface; pass the real window storages from the context or
// any in-memory stand-in from tests.
export interface SimpleStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function safeRemove(storage: SimpleStorage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // storage unavailable (e.g. private mode) — ignore
  }
}

function safeRead<T>(storage: SimpleStorage, key: string): T | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeWrite(storage: SimpleStorage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // quota / unavailable — ignore, same as other demo storage
  }
}

export function isCurrentVerification(value: unknown, now = Date.now()): value is FaydaVerification {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<FaydaVerification>;
  return v.subjectId === 'demo-representative' && typeof v.userId === 'string' && !!v.userId
    && typeof v.fullName === 'string' && typeof v.address === 'string'
    && typeof v.verifiedAt === 'string' && Number.isFinite(Date.parse(v.verifiedAt))
    && typeof v.expiresAt === 'string' && Date.parse(v.expiresAt) > now
    && Date.parse(v.expiresAt) - Date.parse(v.verifiedAt) <= FAYDA_VERIFICATION_TTL_MS;
}

/** Read the current session's verified identity (null when unverified). */
export function readFaydaVerification(session: SimpleStorage): FaydaVerification | null {
  const value = safeRead<unknown>(session, FAYDA_VERIFICATION_KEY);
  if (isCurrentVerification(value)) return value;
  safeRemove(session, FAYDA_VERIFICATION_KEY);
  return null;
}

/** Persist a successful Fayda verification into sessionStorage only. */
export function saveFaydaVerification(session: SimpleStorage, verification: FaydaVerification): void {
  safeWrite(session, FAYDA_VERIFICATION_KEY, verification);
}

/** Clear the session's verified identity (e.g. on logout). */
export function clearFaydaVerification(session: SimpleStorage): void {
  safeRemove(session, FAYDA_VERIFICATION_KEY);
}

/** Read the Fayda-gated vendor registrations (localStorage demo data). */
export function readVendors(local: SimpleStorage): VendorRegistration[] {
  const vendors = safeRead<VendorRegistration[]>(local, VENDOR_KEY);
  // Drop legacy identity-bearing registrations instead of retaining raw FINs.
  const clean = Array.isArray(vendors) ? vendors.filter(v => v && v.contactSubjectId === 'demo-representative' && !('contactFin' in v)) : [];
  if (Array.isArray(vendors) && clean.length !== vendors.length) safeWrite(local, VENDOR_KEY, clean);
  return clean;
}

/** Persist the vendor registrations list. */
export function saveVendors(local: SimpleStorage, vendors: VendorRegistration[]): void {
  safeWrite(local, VENDOR_KEY, vendors);
}