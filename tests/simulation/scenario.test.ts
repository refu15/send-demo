import { describe, expect, it } from "vitest";
import { createFieldSimulationData, getSimulationChecklist } from "@/lib/simulation/scenario";

describe("field simulation scenario", () => {
  it("creates a realistic one-day ride operation dataset", () => {
    const data = createFieldSimulationData();

    expect(data.users).toHaveLength(10);
    expect(data.vehicles).toHaveLength(3);
    expect(data.staff).toHaveLength(5);
    expect(data.ridePlans).toHaveLength(3);
    expect(data.rideStops).toHaveLength(14);
    expect(data.ridePlans.map((plan) => plan.period)).toEqual(["AM", "AM", "PM"]);
    expect(data.users.some((user) => user.wheelchairRequired)).toBe(true);
    expect(data.users.some((user) => user.medicineCheckRequired)).toBe(true);
    expect(data.rideStops.some((stop) => stop.note?.includes("当日キャンセル"))).toBe(true);
  });

  it("describes the workday checks that the demo should exercise", () => {
    const checklist = getSimulationChecklist();

    expect(checklist).toHaveLength(5);
    expect(checklist.map((item) => item.phase)).toEqual([
      "前日準備",
      "朝の出発前",
      "迎え運行中",
      "施設到着後",
      "夕方の送り",
    ]);
    expect(checklist.flatMap((item) => item.checks)).toContain("キャンセル者を配車計画で除外できる");
  });
});
