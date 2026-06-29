import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createRidePlanRecord,
  createRideStopRecord,
  createStaffRecord,
  createUserRecord,
  createVehicleRecord,
  readRideData,
  clearRideData,
  deleteRideStopRecord,
  deleteStaffRecord,
  deleteUserRecord,
  deleteVehicleRecord,
  moveRideStopRecord,
  replaceRideData,
  updateStaffRecord,
  updateUserRecord,
  updateVehicleRecord,
  updateRideStopRecord,
} from "@/lib/db/ride-repository";
import { applyRideEvent } from "@/lib/ride/status";
import type { RideEvent } from "@/lib/ride/types";
import { createFieldSimulationData } from "@/lib/simulation/scenario";

const projectRoot = join(__dirname, "..", "..");
const tempDir = mkdtempSync(join(tmpdir(), "send-demo-prisma-"));
const dbPath = join(tempDir, "test.db").replace(/\\/g, "/");
const databaseUrl = `file:${dbPath}`;

let prisma: PrismaClient;

beforeAll(() => {
  const prismaCli = join(projectRoot, "node_modules", "prisma", "build", "index.js");
  execFileSync(process.execPath, [prismaCli, "db", "push", "--skip-generate"], {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "ignore",
  });
  prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
});

afterAll(async () => {
  await prisma?.$disconnect();
  rmSync(tempDir, { recursive: true, force: true });
});

describe("ride repository", () => {
  it("persists app-managed masters, plans, and stops", async () => {
    await createUserRecord(prisma, {
      id: "user-1",
      name: "山田 花子",
      address: "東京都千代田区1-1",
      phone: "03-1111-2222",
      wheelchairRequired: true,
      medicineCheckRequired: false,
    });
    await createVehicleRecord(prisma, { id: "vehicle-1", name: "1号車", capacity: 6 });
    await createStaffRecord(prisma, { id: "staff-1", name: "佐藤 太郎", role: "driver" });
    await createRidePlanRecord(prisma, {
      id: "plan-1",
      serviceDate: "2026-07-01",
      weekday: "水",
      period: "AM",
      vehicleId: "vehicle-1",
      driverId: "staff-1",
      weather: "晴れ",
    });
    await createRideStopRecord(prisma, {
      id: "stop-1",
      ridePlanId: "plan-1",
      userId: "user-1",
      scheduledTime: "08:40",
    });

    const data = await readRideData(prisma);

    expect(data.users).toHaveLength(1);
    expect(data.vehicles).toHaveLength(1);
    expect(data.staff).toHaveLength(1);
    expect(data.ridePlans[0]).toMatchObject({
      id: "plan-1",
      serviceDate: "2026-07-01",
      weather: "晴れ",
    });
    expect(data.rideStops[0]).toMatchObject({
      id: "stop-1",
      order: 1,
      address: "東京都千代田区1-1",
      phone: "03-1111-2222",
      status: "planned",
    });
  });

  it("persists ride stop status events", async () => {
    const before = (await readRideData(prisma)).rideStops.find((stop) => stop.id === "stop-1");
    expect(before).toBeDefined();
    const event: RideEvent = {
      id: "event-1",
      rideStopId: "stop-1",
      eventType: "arrive",
      occurredAt: "2026-07-01T08:39:00.000Z",
      actorRole: "driver",
      actorName: "driver",
    };
    const updated = applyRideEvent(before!, event);

    await updateRideStopRecord(prisma, updated);

    const after = (await readRideData(prisma)).rideStops.find((stop) => stop.id === "stop-1");
    expect(after).toMatchObject({
      id: "stop-1",
      status: "arrived",
      actual: { arrivedAt: "2026-07-01T08:39:00.000Z" },
    });
    expect(after?.events).toEqual([event]);
  });

  it("replaces the database with the field simulation dataset", async () => {
    await replaceRideData(prisma, createFieldSimulationData());

    const data = await readRideData(prisma);

    expect(data.users).toHaveLength(10);
    expect(data.vehicles).toHaveLength(3);
    expect(data.staff).toHaveLength(5);
    expect(data.ridePlans).toHaveLength(3);
    expect(data.rideStops).toHaveLength(14);
    expect(data.rideStops.find((stop) => stop.id === "sim-stop-am1-005")?.note).toContain(
      "当日キャンセル",
    );
  });

  it("updates, reorders, deletes, and clears ride stops for MVP correction flows", async () => {
    await replaceRideData(prisma, createFieldSimulationData());

    const initial = await readRideData(prisma);
    const first = initial.rideStops.find((stop) => stop.id === "sim-stop-am1-001");
    expect(first).toBeDefined();

    await updateRideStopRecord(prisma, {
      ...first!,
      scheduledTime: "08:18",
      note: "デモ修正: 家族へ電話してから乗車",
    });
    await moveRideStopRecord(prisma, "sim-stop-am1-002", "up");

    const moved = await readRideData(prisma);
    const am1Stops = moved.rideStops.filter((stop) => stop.ridePlanId === "sim-plan-am-1");
    expect(am1Stops.map((stop) => stop.id).slice(0, 2)).toEqual([
      "sim-stop-am1-002",
      "sim-stop-am1-001",
    ]);
    expect(moved.rideStops.find((stop) => stop.id === "sim-stop-am1-001")).toMatchObject({
      order: 2,
      scheduledTime: "08:18",
      note: "デモ修正: 家族へ電話してから乗車",
    });

    await deleteRideStopRecord(prisma, "sim-stop-am1-005");
    const deleted = await readRideData(prisma);
    expect(deleted.rideStops.some((stop) => stop.id === "sim-stop-am1-005")).toBe(false);
    expect(deleted.rideStops.filter((stop) => stop.ridePlanId === "sim-plan-am-1").map((stop) => stop.order)).toEqual([
      1,
      2,
      3,
      4,
    ]);

    await clearRideData(prisma);
    const cleared = await readRideData(prisma);
    expect(cleared.users).toHaveLength(0);
    expect(cleared.ridePlans).toHaveLength(0);
    expect(cleared.rideStops).toHaveLength(0);
  });

  it("updates and deletes unused masters while protecting masters used by ride plans or stops", async () => {
    await replaceRideData(prisma, createFieldSimulationData());

    await updateUserRecord(prisma, "sim-user-010", {
      name: "加藤 正 修正",
      gender: "男性",
      servicePattern: "月・水",
      phone: "03-2222-0010",
      address: "東京都板橋区常盤台10-10-10",
      wheelchairRequired: false,
      medicineCheckRequired: true,
      note: "デモ編集済み",
    });
    await updateVehicleRecord(prisma, "sim-vehicle-003", {
      name: "予備車 修正",
      capacity: 5,
      note: "デモ編集済み",
    });
    await updateStaffRecord(prisma, "sim-staff-005", {
      name: "施設 管理者 修正",
      role: "manager",
      qualification: "デモ編集済み",
    });

    const updated = await readRideData(prisma);
    expect(updated.users.find((user) => user.id === "sim-user-010")).toMatchObject({
      name: "加藤 正 修正",
      medicineCheckRequired: true,
    });
    expect(updated.vehicles.find((vehicle) => vehicle.id === "sim-vehicle-003")).toMatchObject({
      name: "予備車 修正",
      capacity: 5,
    });
    expect(updated.staff.find((staff) => staff.id === "sim-staff-005")).toMatchObject({
      name: "施設 管理者 修正",
      qualification: "デモ編集済み",
    });

    await expect(deleteUserRecord(prisma, "sim-user-001")).rejects.toThrow("User is used");
    await expect(deleteVehicleRecord(prisma, "sim-vehicle-001")).rejects.toThrow("Vehicle is used");
    await expect(deleteStaffRecord(prisma, "sim-staff-001")).rejects.toThrow("Staff is used");

    await createUserRecord(prisma, {
      id: "unused-user",
      name: "未使用 利用者",
      wheelchairRequired: false,
      medicineCheckRequired: false,
    });
    await createVehicleRecord(prisma, { id: "unused-vehicle", name: "未使用 車両" });
    await createStaffRecord(prisma, { id: "unused-staff", name: "未使用 職員", role: "care" });

    await deleteUserRecord(prisma, "unused-user");
    await deleteVehicleRecord(prisma, "unused-vehicle");
    await deleteStaffRecord(prisma, "unused-staff");

    const deleted = await readRideData(prisma);
    expect(deleted.users.some((user) => user.id === "unused-user")).toBe(false);
    expect(deleted.vehicles.some((vehicle) => vehicle.id === "unused-vehicle")).toBe(false);
    expect(deleted.staff.some((staff) => staff.id === "unused-staff")).toBe(false);
  });
});
