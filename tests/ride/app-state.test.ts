import { describe, expect, it } from "vitest";
import {
  addRideStop,
  addStaff,
  addUser,
  addVehicle,
  createEmptyRideData,
  createRidePlan,
} from "@/lib/ride/app-state";

describe("ride app state", () => {
  it("creates masters and a ride plan inside the app data model", () => {
    let data = createEmptyRideData();

    data = addUser(data, {
      id: "user-1",
      name: "山田 花子",
      address: "東京都千代田区1-1",
      phone: "03-1111-2222",
      wheelchairRequired: true,
      medicineCheckRequired: false,
    });
    data = addVehicle(data, { id: "vehicle-1", name: "1号車", capacity: 6 });
    data = addStaff(data, { id: "staff-1", name: "佐藤 太郎", role: "driver" });
    data = createRidePlan(data, {
      id: "plan-1",
      serviceDate: "2026-07-01",
      weekday: "水",
      period: "AM",
      vehicleId: "vehicle-1",
      driverId: "staff-1",
      weather: "晴れ",
    });

    expect(data.users).toHaveLength(1);
    expect(data.vehicles).toHaveLength(1);
    expect(data.staff).toHaveLength(1);
    expect(data.ridePlans[0]).toMatchObject({
      id: "plan-1",
      status: "draft",
      serviceDate: "2026-07-01",
    });
    expect(data.serviceDate).toBe("2026-07-01");
    expect(data.weather).toBe("晴れ");
  });

  it("adds ride stops in order and copies contact fields from the selected user", () => {
    let data = createEmptyRideData();
    data = addUser(data, {
      id: "user-1",
      name: "山田 花子",
      address: "東京都千代田区1-1",
      phone: "03-1111-2222",
      wheelchairRequired: false,
      medicineCheckRequired: true,
    });
    data = addUser(data, {
      id: "user-2",
      name: "鈴木 一郎",
      address: "東京都港区2-2",
      phone: "03-3333-4444",
      wheelchairRequired: false,
      medicineCheckRequired: false,
    });
    data = createRidePlan(data, { id: "plan-1", period: "AM" });

    data = addRideStop(data, {
      id: "stop-1",
      ridePlanId: "plan-1",
      userId: "user-2",
      scheduledTime: "08:40",
    });
    data = addRideStop(data, {
      id: "stop-2",
      ridePlanId: "plan-1",
      userId: "user-1",
      scheduledTime: "08:55",
      note: "玄関で声かけ",
    });

    expect(data.rideStops).toEqual([
      expect.objectContaining({
        id: "stop-1",
        order: 1,
        userId: "user-2",
        address: "東京都港区2-2",
        phone: "03-3333-4444",
        status: "planned",
      }),
      expect.objectContaining({
        id: "stop-2",
        order: 2,
        userId: "user-1",
        address: "東京都千代田区1-1",
        phone: "03-1111-2222",
        note: "玄関で声かけ",
      }),
    ]);
  });

  it("rejects a stop for an unknown user or plan", () => {
    let data = createEmptyRideData();
    data = addUser(data, {
      id: "user-1",
      name: "山田 花子",
      wheelchairRequired: false,
      medicineCheckRequired: false,
    });

    expect(() =>
      addRideStop(data, { id: "stop-1", ridePlanId: "missing", userId: "user-1" }),
    ).toThrow("Ride plan not found");

    data = createRidePlan(data, { id: "plan-1", period: "AM" });

    expect(() =>
      addRideStop(data, { id: "stop-1", ridePlanId: "plan-1", userId: "missing" }),
    ).toThrow("User not found");
  });
});
