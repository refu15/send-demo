import { describe, expect, it } from "vitest";
import {
  createStaticRideData,
  deleteStaticMaster,
  moveStaticRideStop,
  updateStaticMaster,
} from "@/lib/static-demo/mutations";
import { createFieldSimulationData } from "@/lib/simulation/scenario";

describe("static demo mutations", () => {
  it("updates masters and cascades user contact fields to ride stops", () => {
    const data = createFieldSimulationData();
    const updated = updateStaticMaster(data, "users", "sim-user-001", {
      name: "山田 花子 修正",
      phone: "03-9999-0001",
      address: "東京都デモ区1-1-1",
      wheelchairRequired: false,
      medicineCheckRequired: true,
    });

    expect(updated.users.find((user) => user.id === "sim-user-001")).toMatchObject({
      name: "山田 花子 修正",
      medicineCheckRequired: true,
    });
    expect(updated.rideStops.find((stop) => stop.userId === "sim-user-001")).toMatchObject({
      phone: "03-9999-0001",
      address: "東京都デモ区1-1-1",
    });
  });

  it("blocks deletion of masters that are used by ride data", () => {
    const data = createFieldSimulationData();

    expect(() => deleteStaticMaster(data, "users", "sim-user-001")).toThrow("User is used");
    expect(() => deleteStaticMaster(data, "vehicles", "sim-vehicle-001")).toThrow("Vehicle is used");
    expect(() => deleteStaticMaster(data, "staff", "sim-staff-001")).toThrow("Staff is used");
  });

  it("deletes unused masters and moves ride stops", () => {
    const data = createStaticRideData();
    const withoutUser = deleteStaticMaster(
      { ...data, users: [...data.users, { id: "unused", name: "未使用", wheelchairRequired: false, medicineCheckRequired: false }] },
      "users",
      "unused",
    );
    const moved = moveStaticRideStop(createFieldSimulationData(), "sim-stop-am1-002", "up");

    expect(withoutUser.users.some((user) => user.id === "unused")).toBe(false);
    expect(
      moved.rideStops
        .filter((stop) => stop.ridePlanId === "sim-plan-am-1")
        .sort((a, b) => a.order - b.order)
        .map((stop) => stop.id)
        .slice(0, 2),
    ).toEqual(["sim-stop-am1-002", "sim-stop-am1-001"]);
  });
});
