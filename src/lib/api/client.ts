import {
  createStaticRideData,
  createStaticRidePlan,
  createStaticRideStop,
  createStaticStaff,
  createStaticUser,
  createStaticVehicle,
  deleteStaticMaster,
  deleteStaticRideStop,
  moveStaticRideStop,
  updateStaticMaster,
  updateStaticRideStop,
} from "@/lib/static-demo/mutations";
import { createFieldSimulationData } from "@/lib/simulation/scenario";
import type { RideImportResult, RideStop } from "@/lib/ride/types";

const STATIC_STORAGE_KEY = "send-demo-static-data-v1";

export async function fetchRideData(): Promise<RideImportResult> {
  if (isStaticDemo()) {
    return readStaticData();
  }
  return requestRideData("/api/ride-data", { method: "GET" });
}

export async function postRideData(path: string, body: unknown): Promise<RideImportResult> {
  if (isStaticDemo()) {
    return mutateStaticData(path, "POST", body);
  }
  return requestRideData(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function patchRideData(path: string, body: unknown): Promise<RideImportResult> {
  if (isStaticDemo()) {
    return mutateStaticData(path, "PATCH", body);
  }
  return requestRideData(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteRideData(path: string): Promise<RideImportResult> {
  if (isStaticDemo()) {
    return mutateStaticData(path, "DELETE");
  }
  return requestRideData(path, { method: "DELETE" });
}

async function requestRideData(path: string, init: RequestInit): Promise<RideImportResult> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(payload?.error?.message ?? "データ更新に失敗しました");
  }
  return (await response.json()) as RideImportResult;
}

function mutateStaticData(path: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) {
  const current = readStaticData();
  const next = applyStaticMutation(current, path, method, body);
  writeStaticData(next);
  return next;
}

function applyStaticMutation(
  data: RideImportResult,
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
) {
  if (path === "/api/simulation/field-day" && method === "POST") {
    return createFieldSimulationData();
  }
  if (path === "/api/simulation/clear" && method === "POST") {
    return createStaticRideData();
  }
  if (path === "/api/users" && method === "POST") {
    return createStaticUser(data, body as Parameters<typeof createStaticUser>[1]);
  }
  if (path === "/api/vehicles" && method === "POST") {
    return createStaticVehicle(data, body as Parameters<typeof createStaticVehicle>[1]);
  }
  if (path === "/api/staff" && method === "POST") {
    return createStaticStaff(data, body as Parameters<typeof createStaticStaff>[1]);
  }
  if (path === "/api/ride-plans" && method === "POST") {
    return createStaticRidePlan(data, body as Parameters<typeof createStaticRidePlan>[1]);
  }
  if (path === "/api/ride-stops" && method === "POST") {
    return createStaticRideStop(data, body as Parameters<typeof createStaticRideStop>[1]);
  }

  const match = path.match(/^\/api\/(users|vehicles|staff|ride-stops)\/([^/]+)(?:\/move)?$/);
  if (!match) {
    throw new Error("Static demo route is not supported");
  }

  const [, resource, id] = match;
  if (resource === "ride-stops" && path.endsWith("/move") && method === "POST") {
    const direction = (body as { direction?: "up" | "down" })?.direction;
    if (direction !== "up" && direction !== "down") {
      throw new Error("direction is invalid");
    }
    return moveStaticRideStop(data, id, direction);
  }
  if (resource === "ride-stops" && method === "PATCH") {
    return updateStaticRideStop(data, body as RideStop);
  }
  if (resource === "ride-stops" && method === "DELETE") {
    return deleteStaticRideStop(data, id);
  }
  if (resource === "users" && method === "PATCH") {
    return updateStaticMaster(data, "users", id, body as Parameters<typeof updateStaticMaster>[3]);
  }
  if (resource === "vehicles" && method === "PATCH") {
    return updateStaticMaster(data, "vehicles", id, body as Parameters<typeof updateStaticMaster>[3]);
  }
  if (resource === "staff" && method === "PATCH") {
    return updateStaticMaster(data, "staff", id, body as Parameters<typeof updateStaticMaster>[3]);
  }
  if (resource === "users" && method === "DELETE") {
    return deleteStaticMaster(data, "users", id);
  }
  if (resource === "vehicles" && method === "DELETE") {
    return deleteStaticMaster(data, "vehicles", id);
  }
  if (resource === "staff" && method === "DELETE") {
    return deleteStaticMaster(data, "staff", id);
  }

  throw new Error("Static demo route is not supported");
}

function readStaticData() {
  if (typeof window === "undefined") {
    return createFieldSimulationData();
  }
  const raw = window.localStorage.getItem(STATIC_STORAGE_KEY);
  if (!raw) {
    const seeded = createFieldSimulationData();
    writeStaticData(seeded);
    return seeded;
  }
  return JSON.parse(raw) as RideImportResult;
}

function writeStaticData(data: RideImportResult) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STATIC_STORAGE_KEY, JSON.stringify(data));
  }
}

function isStaticDemo() {
  return process.env.NEXT_PUBLIC_STATIC_DEMO === "true";
}
