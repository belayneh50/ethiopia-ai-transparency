import { describe, expect, it } from "vitest";
import {
  FAYDA_DEMO_VERIFIED_FIN,
  FAYDA_FIN_LENGTH,
  FAYDA_TOKEN_TTL_SECONDS,
  isValidFaydaFin,
  mockFaydaAuthentication,
  type FaydaAuthenticationResult,
} from "./faydaService";

function base64UrlDecode(segment: string): string {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (segment.length % 4)) % 4);
  return atob(padded);
}

function parseToken(token: string): { header: Record<string, unknown>; payload: Record<string, unknown> } {
  const segments = token.split(".");
  expect(segments).toHaveLength(3);
  expect(segments[0]).toMatch(/^[A-Za-z0-9_-]+$/);
  expect(segments[1]).toMatch(/^[A-Za-z0-9_-]+$/);
  return {
    header: JSON.parse(base64UrlDecode(segments[0])) as Record<string, unknown>,
    payload: JSON.parse(base64UrlDecode(segments[1])) as Record<string, unknown>,
  };
}

describe("isValidFaydaFin (structural rules)", () => {
  it("accepts exactly 12 ASCII digits", () => {
    expect(isValidFaydaFin("123456789012")).toBe(true);
    expect(isValidFaydaFin("000000000000")).toBe(true);
    expect(isValidFaydaFin("991234567890")).toBe(true);
  });

  it("trims surrounding whitespace but rejects internal separators", () => {
    expect(isValidFaydaFin("  123456789012  ")).toBe(true);
    expect(isValidFaydaFin("123 456789012")).toBe(false);
    expect(isValidFaydaFin("1234-5678-9012")).toBe(false);
  });

  it("rejects wrong length, non-digits, and non-strings", () => {
    expect(isValidFaydaFin("12345678901")).toBe(false);
    expect(isValidFaydaFin("1234567890123")).toBe(false);
    expect(isValidFaydaFin("12345678901a")).toBe(false);
    expect(isValidFaydaFin("abcdefghijkl")).toBe(false);
    expect(isValidFaydaFin("")).toBe(false);
    expect(isValidFaydaFin(undefined)).toBe(false);
    expect(isValidFaydaFin(null)).toBe(false);
    expect(isValidFaydaFin(123456789012)).toBe(false);
  });
});

describe("mockFaydaAuthentication", () => {
  it("resolves (not throws) for an unknown-shape failure and a success", async () => {
    await expect(mockFaydaAuthentication("12")).resolves.toMatchObject({ ok: false, code: "invalid_fin" });
    await expect(mockFaydaAuthentication(FAYDA_DEMO_VERIFIED_FIN)).resolves.toMatchObject({ ok: true });
  });

  it("rejects structurally invalid FINs with invalid_fin and a helpful message", async () => {
    for (const fin of ["", "12345", "12345678901a", " 123 456789012"]) {
      const result = await mockFaydaAuthentication(fin);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("invalid_fin");
        expect(result.message).toContain(String(FAYDA_FIN_LENGTH));
      }
    }
  });

  it("rejects structurally valid but unregistered FINs (99 prefix) with fin_not_found", async () => {
    const result = await mockFaydaAuthentication("991234567890");
    expect(result).toMatchObject({ ok: false, code: "fin_not_found" });
  });

  it("rejects the reserved all-zeros FIN with nidp_unavailable", async () => {
    const result = await mockFaydaAuthentication("000000000000");
    expect(result).toMatchObject({ ok: false, code: "nidp_unavailable" });
  });

  it("returns an obviously-mock, unsigned JWT-shaped id_token", async () => {
    const result = (await mockFaydaAuthentication(FAYDA_DEMO_VERIFIED_FIN)) as Extract<FaydaAuthenticationResult, { ok: true }>;
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { header, payload } = parseToken(result.idToken);
    expect(header).toMatchObject({ alg: "none", typ: "JWT", mock: true });
    expect(payload.iss).toBe("fayda-nidp-mock");
    expect(payload.exp).toBeTypeOf("number");
    expect(Number(payload.exp) - Number(payload.iat)).toBe(FAYDA_TOKEN_TTL_SECONDS);
    expect(result.expiresInSeconds).toBe(FAYDA_TOKEN_TTL_SECONDS);
    // The token must never echo the raw FIN (minimal-data handling).
    expect(JSON.stringify(payload)).not.toContain(FAYDA_DEMO_VERIFIED_FIN);
    // The signature segment is empty, so this can never validate as a credential.
    expect(result.idToken.endsWith(".")).toBe(true);
    expect(result.idToken.split(".")[2]).toBe("");
  });

  it("exposes exactly the NIDP minimal-data fields, nothing more", async () => {
    const result = (await mockFaydaAuthentication(FAYDA_DEMO_VERIFIED_FIN)) as Extract<FaydaAuthenticationResult, { ok: true }>;
    if (!result.ok) return;
    expect(Object.keys(result.minimalData).sort()).toEqual(["address", "biometricVerified", "fullName"]);
    expect(result.minimalData.biometricVerified).toBe(true);
    expect(result.minimalData.fullName.length).toBeGreaterThan(0);
    expect(result.minimalData.address.length).toBeGreaterThan(0);
  });

  it("maps the same FIN to the same demo identity every time", async () => {
    const a = (await mockFaydaAuthentication(FAYDA_DEMO_VERIFIED_FIN)) as Extract<FaydaAuthenticationResult, { ok: true }>;
    const b = (await mockFaydaAuthentication(FAYDA_DEMO_VERIFIED_FIN)) as Extract<FaydaAuthenticationResult, { ok: true }>;
    if (!a.ok || !b.ok) return;
    expect(b.minimalData).toEqual(a.minimalData);
  });
});
