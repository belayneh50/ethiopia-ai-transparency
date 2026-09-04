// Pure storage rules for the auth session — no window/DOM access, so they are
// unit-testable in the plain node Vitest environment (authStorage.test.ts).
//
// Contract locked here:
//  - auth lives in sessionStorage ONLY: a new window or a new browser session
//    starts logged out (the login page), while a same-tab reload keeps the
//    current session;
//  - every read purges the legacy localStorage auth keys, so a stale login from
//    an older version can never skip the login page;
//  - nothing else in localStorage (demo records, comparables, …) is ever read,
//    written, or removed by the auth layer.

export const TOKEN_KEY = 'ethiopia_ai_token_v1';
export const USER_KEY = 'ethiopia_ai_user_v1';

// Minimal Storage surface; pass the real window storages from AuthContext or
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
    // storage unavailable (e.g. private mode) — ignore, same as before
  }
}

/** Remove the legacy localStorage auth keys. Never touches any other key. */
export function purgeLegacyAuth(local: SimpleStorage): void {
  safeRemove(local, TOKEN_KEY);
  safeRemove(local, USER_KEY);
}

/**
 * Read the auth session, purging the legacy localStorage keys first.
 * Returns raw values; the caller JSON-parses the user payload.
 */
export function readStoredAuth(
  session: SimpleStorage,
  local: SimpleStorage,
): { userRaw: string | null; token: string | null } {
  purgeLegacyAuth(local);
  try {
    return { userRaw: session.getItem(USER_KEY), token: session.getItem(TOKEN_KEY) };
  } catch {
    return { userRaw: null, token: null };
  }
}

/** Persist a successful login into sessionStorage only — never localStorage. */
export function saveAuthSession(session: SimpleStorage, userJson: string, token: string): void {
  session.setItem(TOKEN_KEY, token);
  session.setItem(USER_KEY, userJson);
}

/** Clear the session (logout) and purge any legacy localStorage auth keys. */
export function clearAuthSession(session: SimpleStorage, local: SimpleStorage): void {
  safeRemove(session, TOKEN_KEY);
  safeRemove(session, USER_KEY);
  purgeLegacyAuth(local);
}
