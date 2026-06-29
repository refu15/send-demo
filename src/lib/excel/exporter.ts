import ExcelJS from "exceljs";
import type { RideImportResult } from "@/lib/ride/types";

export async function exportRideWorkbook(data: RideImportResult): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "send-demo";
  workbook.created = new Date();

  addRideScheduleSheet(workbook, data);
  addUsersSheet(workbook, data);
  addVehiclesSheet(workbook, data);
  addStaffSheet(workbook, data);
  addPlansSheet(workbook, data);
  addStopsSheet(workbook, data);

  const buffer = await workbook.xlsx.writeBuffer();
  return toArrayBuffer(buffer);
}

function addRideScheduleSheet(workbook: ExcelJS.Workbook, data: RideImportResult) {
  const sheet = workbook.addWorksheet("送迎表");
  sheet.getCell("A1").value = "送迎表";
  sheet.getCell("A1").font = { bold: true, size: 16 };
  sheet.getCell("A2").value = `対象日: ${data.serviceDate ?? ""} ${data.weekday ?? ""}`;
  sheet.getCell("D2").value = `天気: ${data.weather ?? ""}`;

  sheet.columns = [
    { key: "order", width: 8 },
    { key: "time", width: 12 },
    { key: "user", width: 18 },
    { key: "phone", width: 18 },
    { key: "address", width: 36 },
    { key: "note", width: 42 },
    { key: "status", width: 14 },
  ];

  let rowIndex = 4;
  data.ridePlans.forEach((plan) => {
    const vehicle = data.vehicles.find((item) => item.id === plan.vehicleId);
    const driver = data.staff.find((item) => item.id === plan.driverId);
    const attendant = data.staff.find((item) => item.id === plan.attendantId);
    const planStops = data.rideStops
      .filter((stop) => stop.ridePlanId === plan.id)
      .sort((a, b) => a.order - b.order);

    const planTitle = `${plan.period}便 / ${vehicle?.name ?? "車両未選択"} / ${
      driver?.name ?? "ドライバー未選択"
    } / 添乗: ${attendant?.name ?? "未選択"}`;
    sheet.mergeCells(rowIndex, 1, rowIndex, 7);
    sheet.getCell(rowIndex, 1).value = planTitle;
    sheet.getCell(rowIndex, 1).font = { bold: true };
    sheet.getCell(rowIndex, 1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE7F0EB" },
    };
    rowIndex += 1;

    sheet.getRow(rowIndex).values = ["順", "予定", "利用者", "電話", "住所", "備考", "状態"];
    sheet.getRow(rowIndex).font = { bold: true };
    rowIndex += 1;

    planStops.forEach((stop) => {
      const user = data.users.find((item) => item.id === stop.userId);
      sheet.getRow(rowIndex).values = [
        stop.order,
        stop.scheduledTime ?? "",
        user?.name ?? "",
        stop.phone ?? "",
        stop.address ?? "",
        stop.note ?? "",
        stop.status,
      ];
      rowIndex += 1;
    });
    rowIndex += 1;
  });
}

function addUsersSheet(workbook: ExcelJS.Workbook, data: RideImportResult) {
  const sheet = workbook.addWorksheet("利用者");
  sheet.columns = [
    { header: "ID", key: "id", width: 24 },
    { header: "氏名", key: "name", width: 18 },
    { header: "性別", key: "gender", width: 10 },
    { header: "利用パターン", key: "servicePattern", width: 18 },
    { header: "電話", key: "phone", width: 18 },
    { header: "住所", key: "address", width: 36 },
    { header: "車いす", key: "wheelchairRequired", width: 10 },
    { header: "薬確認", key: "medicineCheckRequired", width: 10 },
    { header: "備考", key: "note", width: 32 },
  ];
  data.users.forEach((user) => {
    sheet.addRow({
      ...user,
      wheelchairRequired: user.wheelchairRequired ? "要" : "",
      medicineCheckRequired: user.medicineCheckRequired ? "要" : "",
    });
  });
  styleSheet(sheet);
}

function addVehiclesSheet(workbook: ExcelJS.Workbook, data: RideImportResult) {
  const sheet = workbook.addWorksheet("車両");
  sheet.columns = [
    { header: "ID", key: "id", width: 24 },
    { header: "車両名", key: "name", width: 18 },
    { header: "定員", key: "capacity", width: 10 },
    { header: "備考", key: "note", width: 32 },
  ];
  data.vehicles.forEach((vehicle) => sheet.addRow(vehicle));
  styleSheet(sheet);
}

function addStaffSheet(workbook: ExcelJS.Workbook, data: RideImportResult) {
  const sheet = workbook.addWorksheet("職員");
  sheet.columns = [
    { header: "ID", key: "id", width: 24 },
    { header: "氏名", key: "name", width: 18 },
    { header: "役割", key: "role", width: 14 },
    { header: "資格・補足", key: "qualification", width: 32 },
  ];
  data.staff.forEach((staff) => sheet.addRow(staff));
  styleSheet(sheet);
}

function addPlansSheet(workbook: ExcelJS.Workbook, data: RideImportResult) {
  const sheet = workbook.addWorksheet("送迎便");
  sheet.columns = [
    { header: "ID", key: "id", width: 24 },
    { header: "対象日", key: "serviceDate", width: 14 },
    { header: "曜日", key: "weekday", width: 8 },
    { header: "区分", key: "period", width: 8 },
    { header: "車両", key: "vehicle", width: 18 },
    { header: "ドライバー", key: "driver", width: 18 },
    { header: "添乗", key: "attendant", width: 18 },
    { header: "天気", key: "weather", width: 12 },
    { header: "状態", key: "status", width: 14 },
  ];
  data.ridePlans.forEach((plan) => {
    sheet.addRow({
      ...plan,
      vehicle: data.vehicles.find((vehicle) => vehicle.id === plan.vehicleId)?.name,
      driver: data.staff.find((staff) => staff.id === plan.driverId)?.name,
      attendant: data.staff.find((staff) => staff.id === plan.attendantId)?.name,
    });
  });
  styleSheet(sheet);
}

function addStopsSheet(workbook: ExcelJS.Workbook, data: RideImportResult) {
  const sheet = workbook.addWorksheet("停車順");
  sheet.columns = [
    { header: "送迎便ID", key: "ridePlanId", width: 24 },
    { header: "順番", key: "order", width: 8 },
    { header: "予定時刻", key: "scheduledTime", width: 12 },
    { header: "利用者ID", key: "userId", width: 24 },
    { header: "利用者", key: "userName", width: 18 },
    { header: "状態", key: "status", width: 14 },
    { header: "電話", key: "phone", width: 18 },
    { header: "住所", key: "address", width: 36 },
    { header: "備考", key: "note", width: 32 },
  ];
  [...data.rideStops]
    .sort((a, b) => a.ridePlanId.localeCompare(b.ridePlanId) || a.order - b.order)
    .forEach((stop) => {
      sheet.addRow({
        ...stop,
        userName: data.users.find((user) => user.id === stop.userId)?.name,
      });
    });
  styleSheet(sheet);
}

function styleSheet(sheet: ExcelJS.Worksheet) {
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columnCount },
  };
}

function toArrayBuffer(buffer: ExcelJS.Buffer): ArrayBuffer {
  if (buffer instanceof ArrayBuffer) {
    return buffer.slice(0);
  }

  const view = buffer as Uint8Array;
  const arrayBuffer = new ArrayBuffer(view.byteLength);
  new Uint8Array(arrayBuffer).set(view);
  return arrayBuffer;
}
