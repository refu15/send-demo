import { describe, expect, it } from "vitest";
import { sha256Hex, verifyDemoPassword } from "@/lib/security/demo-password";

describe("demo password gate", () => {
  it("verifies a password against a SHA-256 hash", async () => {
    const hash = await sha256Hex("demo-pass");

    await expect(verifyDemoPassword("demo-pass", hash)).resolves.toBe(true);
    await expect(verifyDemoPassword("wrong-pass", hash)).resolves.toBe(false);
  });

  it("fails closed when no hash is configured", async () => {
    await expect(verifyDemoPassword("demo-pass", undefined)).resolves.toBe(false);
  });
});
