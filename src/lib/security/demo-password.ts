const EXPECTED_HASH = process.env.NEXT_PUBLIC_DEMO_PASSWORD_SHA256?.trim().toLowerCase();

export const DEMO_PASSWORD_SESSION_KEY = "send-demo-password-ok-v1";

export function isDemoPasswordGateEnabled() {
  return process.env.NEXT_PUBLIC_STATIC_DEMO === "true" && Boolean(EXPECTED_HASH);
}

export function getExpectedDemoPasswordHash() {
  return EXPECTED_HASH;
}

export async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyDemoPassword(input: string, expectedHash = EXPECTED_HASH) {
  const normalizedHash = expectedHash?.trim().toLowerCase();
  if (!normalizedHash) {
    return false;
  }
  return (await sha256Hex(input)) === normalizedHash;
}
