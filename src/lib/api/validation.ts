export type JsonObject = Record<string, unknown>;

export function assertJsonObject(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid request body");
  }
  return value as JsonObject;
}

export function requiredString(input: JsonObject, key: string): string {
  const value = input[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

export function optionalString(input: JsonObject, key: string): string | undefined {
  const value = input[key];
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function optionalNumber(input: JsonObject, key: string): number | undefined {
  const value = input[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

export function booleanValue(input: JsonObject, key: string): boolean {
  return input[key] === true;
}

export function createApiId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}
