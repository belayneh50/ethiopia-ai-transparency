import { describe, expect, it } from "vitest";
import {
  clearAuthSession,
  readStoredAuth,
  saveAuthSession,
  TOKEN_KEY,
  USER_KEY,
  type SimpleStorage,
} from "./authStorage";

// Demo records/comparables live in localStorage under these keys (see App.tsx)
// and must never be touched by the auth layer.
const RECORDS_KEY = "ethiopia_ai_transparency_records_v1";
const COMPARABLES_KEY = "ethiopia_ai_transparency_comparables_v1";
const OTHER_KEY = "some_unrelated_app_key";

/** In-memory Storage stand-in that records every write/remove it receives. */
function makeStorage(): { store: SimpleStorage; writes: string[]; removes: string[] } {
  const map = new Map<string, string>();
  const writes: string[] = [];
  const removes: string[] = [];
  return {
    writes,
    removes,
    store: {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => {
        map.set(key, value);
        writes.push(key);
      },
      removeItem: (key: string) => {
        map.delete(key);
        removes.push(key);
      },
    },
  };
}

const USER_JSON = '{"id":"u1","email":"a@b.c","name":"A","role":"public"}';

describe("authStorage session rules", () => {
  it("readStoredAuth purges legacy localStorage auth keys so a stale login can never skip the login page", () => {
    const session = makeStorage();
    const local = makeStorage();
    // Simulate a stale login from the pre-fix version: auth keys in localStorage.
    local.store.setItem(TOKEN_KEY, "stale-token");
    local.store.setItem(USER_KEY, USER_JSON);
    local.store.setItem(RECORDS_KEY, "[stale records]");
    local.store.setItem(OTHER_KEY, "keep-me");

    const read = readStoredAuth(session.store, local.store);

    expect(read).toEqual({ userRaw: null, token: null }); // nothing in session yet
    expect(local.store.getItem(TOKEN_KEY)).toBeNull();
    expect(local.store.getItem(USER_KEY)).toBeNull();
    // Only the two legacy auth keys were removed.
    expect(local.removes).toEqual([TOKEN_KEY, USER_KEY]);
    expect(local.store.getItem(RECORDS_KEY)).toBe("[stale records]");
    expect(local.store.getItem(OTHER_KEY)).toBe("keep-me");
  });

  it("saveAuthSession writes to sessionStorage only — never localStorage", () => {
    const session = makeStorage();
    const local = makeStorage();

    saveAuthSession(session.store, USER_JSON, "token-123");

    expect(session.store.getItem(TOKEN_KEY)).toBe("token-123");
    expect(session.store.getItem(USER_KEY)).toBe(USER_JSON);
    expect(local.writes).toEqual([]); // localStorage untouched entirely
  });

  it("readStoredAuth returns the session values after a login and still purges legacy keys", () => {
    const session = makeStorage();
    const local = makeStorage();
    saveAuthSession(session.store, USER_JSON, "token-123");
    // A legacy stale login shows up later in localStorage.
    local.store.setItem(TOKEN_KEY, "stale");

    const read = readStoredAuth(session.store, local.store);

    expect(read).toEqual({ userRaw: USER_JSON, token: "token-123" });
    expect(local.store.getItem(TOKEN_KEY)).toBeNull();
  });

  it("clearAuthSession removes the session keys and legacy keys, leaving demo records untouched", () => {
    const session = makeStorage();
    const local = makeStorage();
    saveAuthSession(session.store, USER_JSON, "token-123");
    // Pre-existing unrelated state that must survive a logout.
    local.store.setItem(RECORDS_KEY, "[records]");
    local.store.setItem(COMPARABLES_KEY, "[comparables]");
    local.store.setItem(OTHER_KEY, "keep-me");
    // Legacy stale auth keys are also cleared on logout.
    local.store.setItem(TOKEN_KEY, "stale");
    local.store.setItem(USER_KEY, USER_JSON);

    clearAuthSession(session.store, local.store);

    // Logged-out state: nothing readable in session or legacy auth keys.
    expect(session.store.getItem(TOKEN_KEY)).toBeNull();
    expect(session.store.getItem(USER_KEY)).toBeNull();
    expect(local.store.getItem(TOKEN_KEY)).toBeNull();
    expect(local.store.getItem(USER_KEY)).toBeNull();
    // Demo records and unrelated state survive the whole lifecycle.
    expect(local.store.getItem(RECORDS_KEY)).toBe("[records]");
    expect(local.store.getItem(COMPARABLES_KEY)).toBe("[comparables]");
    expect(local.store.getItem(OTHER_KEY)).toBe("keep-me");
  });

  it("reads and logout-purges tolerate unavailable storages (private mode) without throwing", () => {
    const broken: SimpleStorage = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    expect(() => readStoredAuth(broken, broken)).not.toThrow();
    expect(readStoredAuth(broken, broken)).toEqual({ userRaw: null, token: null });
    expect(() => clearAuthSession(broken, broken)).not.toThrow();
    // saveAuthSession is intentionally NOT tolerant: a failed write must surface
    // so login() reports the failure instead of silently persisting nothing.
  });
});
