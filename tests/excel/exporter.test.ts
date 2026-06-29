import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  addRideStop,
  addUser,
  addVehicle,
  createEmptyRideData,
  createRidePlan,
} from "@/lib/ride/app-state";
import { exportRideWorkbook } from "@/lib/excel/exporter";

describe("exportRideWorkbook", () => {
  it("exports app-managed users, plans, and stops to an Excel workbook", async () => {
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
    data = createRidePlan(data, {
      id: "plan-1",
      serviceDate: "2026-07-01",
      weekday: "水",
      period: "AM",
      vehicleId: "vehicle-1",
      weather: "晴れ",
    });
    data = addRideStop(data, {
      id: "stop-1",
      ridePlanId: "plan-1",
      userId: "user-1",
      scheduledTime: "08:40",
    });

    const buffer = await exportRideWorkbook(data);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    expect(workbook.worksheets[0].name).toBe("送迎表");
    expect(workbook.getWorksheet("送迎表")?.getCell("A1").value).toBe("送迎表");
    expect(workbook.getWorksheet("送迎表")?.getCell("A5").value).toBe("順");
    expect(workbook.getWorksheet("利用者")?.getRow(2).getCell(2).value).toBe("山田 花子");
    expect(workbook.getWorksheet("送迎便")?.getRow(2).getCell(2).value).toBe("2026-07-01");
    expect(workbook.getWorksheet("停車順")?.getRow(2).getCell(5).value).toBe("山田 花子");
  });
});
