// ---------------------------------------------------------------------------
// Fayda Digital ID mock service — project master plan, Step 2.
//
// Simulates the Ethiopian National ID Program (NIDP) verification system for
// eKYC demos. This is NOT a real credential service: it accepts a small,
// deterministic rule table, returns clearly-labeled mock tokens, and exposes
// only NIDP minimal data (full name, address, biometric status). No national
// checksum exists for a Fayda Identification Number in this mock; FIN
// validation is purely structural (exactly 12 digits).
// ---------------------------------------------------------------------------

export const FAYDA_FIN_LENGTH = 12;
/** Simulated NIDP round-trip latency so the caller sees a realistic async flow. */
export const FAYDA_MOCK_LATENCY_MS = 200;
/** The mock "identity" tokens live for five simulated minutes. */
export const FAYDA_TOKEN_TTL_SECONDS = 300;

const FIN_STRUCTURE = /^\d{12}$/;

// ---------------------------------------------------------------------------
// Deterministic demo rule table (all decisions are pure functions of the FIN):
//   * structurally invalid        -> invalid_fin
//   * exactly "000000000000"      -> nidp_unavailable (reserved outage demo)
//   * starts with "99"            -> fin_not_found (not registered in mock NIDP)
//   * the supplied demo FIN only  -> simulated success; other values rejected
// ---------------------------------------------------------------------------

/** A FIN that authenticates successfully in the mock (for the demo UI). */
export const FAYDA_DEMO_VERIFIED_FIN = "123456789012";

export type FaydaMinimalData = {
  /** NIDP minimal data only — never echoes the FIN or any extra demographics. */
  fullName: string;
  address: string;
  biometricVerified: boolean;
};

export type FaydaAuthFailureCode = "invalid_fin" | "fin_not_found" | "nidp_unavailable" | "demo_only";

export type FaydaAuthenticationSuccess = {
  ok: true;
  /** Mock JWT-shaped id_token (unsigned: alg "none", empty signature — see issueMockIdToken). */
  idToken: string;
  expiresInSeconds: number;
  minimalData: FaydaMinimalData;
};

export type FaydaAuthenticationFailure = {
  ok: false;
  code: FaydaAuthFailureCode;
  message: string;
};

export type FaydaAuthenticationResult = FaydaAuthenticationSuccess | FaydaAuthenticationFailure;

/**
 * Structural validation of a Fayda Identification Number.
 * Chosen rule: trimmed input must be exactly 12 ASCII digits. No checksum is
 * invented — the plan specifies no national checksum algorithm, and this mock
 * has no authority to define one.
 */
export function isValidFaydaFin(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return FIN_STRUCTURE.test(value.trim());
}

// Ten demo identities; the chosen entry is derived deterministically from the
// FIN's last two digits so repeat verifications are stable without storing PII.
const MOCK_IDENTITIES: Array<Omit<FaydaMinimalData, "biometricVerified">> = [
  { fullName: "Hanna Tadesse", address: "Addis Ababa, Bole Sub-city" },
  { fullName: "Dawit Bekele", address: "Addis Ababa, Yeka Sub-city" },
  { fullName: "Sara Alemu", address: "Adama, Oromia" },
  { fullName: "Yonas Girma", address: "Hawassa, Sidama" },
  { fullName: "Meron Kebede", address: "Addis Ababa, Kirkos Sub-city" },
  { fullName: "Abel Mekonnen", address: "Bahir Dar, Amhara" },
  { fullName: "Liya Haile", address: "Mekelle, Tigray" },
  { fullName: "Samuel Tesfaye", address: "Dire Dawa" },
  { fullName: "Bethlehem Alebachew", address: "Addis Ababa, Arada Sub-city" },
  { fullName: "Natnael Wondimu", address: "Gondar, Amhara" },
];

function minimalDataFor(fin: string): FaydaMinimalData {
  const index = Number(fin.slice(-2)) % MOCK_IDENTITIES.length;
  return { ...MOCK_IDENTITIES[index], biometricVerified: true };
}

/** base64url-encode a UTF-8 string without padding (browser-safe, no Buffer). */
function base64UrlEncode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Issues the mock JWT-shaped id_token.
 *
 * Honesty notes: the header declares `alg: "none"` and `mock: true`, the
 * signature segment is empty (the token is intentionally unsigned), and the
 * issuer is `fayda-nidp-mock`. Any JWT library can parse the header/payload,
 * but nothing here could ever be mistaken for or validated as a real NIDP
 * credential. The payload carries a derived subject id — never the raw FIN —
 * consistent with minimal-data handling.
 */
function issueMockIdToken(fin: string, issuedAtSeconds: number): string {
  const header = { alg: "none", typ: "JWT", mock: true };
  const derivedSubject = `mock-subject-${Number(fin) % 100_000}`;
  const payload = {
    iss: "fayda-nidp-mock",
    aud: "ethiopia-ai-transparency-demo",
    sub: derivedSubject,
    iat: issuedAtSeconds,
    exp: issuedAtSeconds + FAYDA_TOKEN_TTL_SECONDS,
    nonce: "mock-nonce",
  };
  return `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}.`;
}

/**
 * Simulated OIDC authentication against the mock NIDP.
 * Resolves to a discriminated union: a successful eKYC carrying the mock
 * id_token plus minimal data, or a typed failure (never a thrown exception).
 */
export async function mockFaydaAuthentication(fin: string): Promise<FaydaAuthenticationResult> {
  fin = fin.trim();
  await new Promise((resolve) => setTimeout(resolve, FAYDA_MOCK_LATENCY_MS));

  if (!isValidFaydaFin(fin)) {
    return { ok: false, code: "invalid_fin", message: `A Fayda Identification Number must be exactly ${FAYDA_FIN_LENGTH} digits.` };
  }
  if (fin === "000000000000") {
    return { ok: false, code: "nidp_unavailable", message: "The mock NIDP is temporarily unavailable. Try again in a moment." };
  }
  if (fin.startsWith("99")) {
    return { ok: false, code: "fin_not_found", message: "No registered identity matches this FIN in the mock NIDP." };
  }

  if (fin !== FAYDA_DEMO_VERIFIED_FIN) return { ok: false, code: "demo_only", message: "Use the supplied synthetic demo identifier only." };

  return {
    ok: true,
    idToken: issueMockIdToken(fin, Math.floor(Date.now() / 1000)),
    expiresInSeconds: FAYDA_TOKEN_TTL_SECONDS,
    minimalData: minimalDataFor(fin),
  };
}
