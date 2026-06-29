import ExcelJS from "exceljs";
import type {
  ImportError,
  RideImportResult,
  RidePeriod,
  RidePlan,
  RideStop,
  Staff,
  StaffRole,
  User,
  Vehicle,
} from "@/lib/ride/types";

type CellValue = string | number | boolean | Date | null | undefined;
type Row = CellValue[];

const requiredSheets = ["Sheet1", "Sheet2", "Sheet3"];

type RideSectionMetadata = {
  serviceDate?: string;
  weekday?: string;
  weather?: string;
  period: RidePeriod;
  vehicleName?: string;
  driverName?: string;
  attendantName?: string;
};

type RideSection = {
  index: number;
  metadata: RideSectionMetadata;
  headerIndex: number;
  dataStartIndex: number;
  dataEndIndex: number;
};

const userHeaderLabels: Record<keyof UserRow, string[]> = {
  servicePattern: ["利用日"],
  name: ["氏名", "名前", "利用者", "利用者名"],
  gender: ["性別"],
  wheelchair: ["車椅子"],
  medicine: ["薬確認"],
  scheduledTime: ["予定時刻", "時間"],
  phone: ["電話", "連絡先"],
  note: ["備考欄", "備考"],
  address: ["住所"],
};

export async function importRideWorkbook(input: ArrayBuffer): Promise<RideImportResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(input);
  const errors = validateRequiredSheets(workbook);

  if (errors.length > 0) {
    return emptyResult(errors);
  }

  const sheet1 = sheetToRows(workbook.getWorksheet("Sheet1"));
  const sheet2 = sheetToRows(workbook.getWorksheet("Sheet2"));
  const sheet3 = sheetToRows(workbook.getWorksheet("Sheet3"));

  const globalMetadata = parseGlobalMetadata(sheet1);
  const sections = parseRideSections(sheet1);
  const vehicles = parseVehicles(sheet2, sections);
  const staff = parseStaff(sheet2, sections);
  const users = parseUsers(sheet1, sheet3);
  const ridePlans = sections.map((section) => buildRidePlan(section, vehicles, staff));
  const rideStops = sections.flatMap((section) =>
    parseRideStopsForSection(sheet1, section, ridePlans[section.index].id, users),
  );

  return {
    serviceDate: globalMetadata.serviceDate,
    weekday: globalMetadata.weekday,
    weather: globalMetadata.weather,
    users,
    vehicles,
    staff,
    ridePlans,
    rideStops,
    errors: [],
    warnings: [],
  };
}

function validateRequiredSheets(workbook: ExcelJS.Workbook): ImportError[] {
  return requiredSheets
    .filter((sheetName) => !workbook.getWorksheet(sheetName))
    .map((sheetName) => ({
      code: "missing_sheet",
      message: `${sheetName} が見つかりません。`,
      sheet: sheetName,
    }));
}

function emptyResult(errors: ImportError[]): RideImportResult {
  return {
    users: [],
    vehicles: [],
    staff: [],
    ridePlans: [],
    rideStops: [],
    errors,
    warnings: [],
  };
}

function sheetToRows(sheet: ExcelJS.Worksheet | undefined): Row[] {
  if (!sheet) {
    return [];
  }

  const rows: Row[] = [];
  sheet.eachRow({ includeEmpty: true }, (row) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    rows.push(values.map(normalizeCellValue));
  });
  return rows;
}

function normalizeCellValue(value: ExcelJS.CellValue): CellValue {
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return value.text;
    }
    if ("result" in value) {
      return normalizeCellValue(value.result as ExcelJS.CellValue);
    }
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((item) => item.text).join("");
    }
    return String(value);
  }
  return value;
}

function parseGlobalMetadata(rows: Row[]) {
  const headerRow = rows[1] ?? [];

  return {
    serviceDate: firstDateLike(headerRow),
    weekday: cellText(headerRow[3]),
    weather: cellText(headerRow[4]),
  };
}

function parseRideSections(rows: Row[]): RideSection[] {
  const global = parseGlobalMetadata(rows);
  const starts = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => isSectionStart(row))
    .map(({ index }) => index);
  const globalHeaderIndex = findUserHeaderIndex(rows, 0, rows.length) ?? 0;

  if (starts.length === 0) {
    return [
      {
        index: 0,
        metadata: {
          ...global,
          period: findPeriod(rows, 0, rows.length) ?? "AM",
          vehicleName: undefined,
          driverName: undefined,
          attendantName: undefined,
        },
        headerIndex: globalHeaderIndex,
        dataStartIndex: globalHeaderIndex + 1,
        dataEndIndex: rows.length,
      },
    ];
  }

  return starts.map((startIndex, index) => {
    const nextStartIndex = starts[index + 1] ?? rows.length;
    const headerIndex =
      findUserHeaderIndex(rows, startIndex, nextStartIndex) ?? globalHeaderIndex;
    const dataStartIndex =
      headerIndex >= startIndex && headerIndex < nextStartIndex
        ? headerIndex + 1
        : startIndex + 1;
    const totalIndex = findTotalRowIndex(rows, dataStartIndex, nextStartIndex);
    const metaRow = rows[startIndex] ?? [];

    return {
      index,
      metadata: {
        ...global,
        period: findPeriod(rows, startIndex, dataStartIndex) ?? "AM",
        vehicleName: valueAfterLabel(metaRow, "車両"),
        driverName: valueAfterLabel(metaRow, "運転手"),
        attendantName: valueAfterLabel(metaRow, "添乗員"),
      },
      headerIndex,
      dataStartIndex,
      dataEndIndex: totalIndex ?? nextStartIndex,
    };
  });
}

function parseVehicles(sheet2Rows: Row[], sections: RideSection[]): Vehicle[] {
  const names = new Set<string>();

  for (const section of sections) {
    if (section.metadata.vehicleName) {
      names.add(section.metadata.vehicleName);
    }
  }

  for (const row of sheet2Rows) {
    for (let index = 0; index < row.length; index += 1) {
      const previous = cellText(row[index - 1]);
      const value = cellText(row[index]);
      if (previous === "車両" && value) {
        names.add(value);
      }
    }
  }

  return [...names].map((name, index) => ({
    id: stableId("vehicle", name, index),
    name,
  }));
}

function parseStaff(sheet2Rows: Row[], sections: RideSection[]): Staff[] {
  const staffByName = new Map<string, StaffRole>();

  for (const section of sections) {
    if (section.metadata.driverName) {
      staffByName.set(section.metadata.driverName, "driver");
    }
    if (section.metadata.attendantName) {
      staffByName.set(section.metadata.attendantName, "attendant");
    }
  }

  for (const row of sheet2Rows) {
    const first = cellText(row[0]);
    const second = cellText(row[1]);
    if (first && first !== "運転手" && first !== "車両" && second && second !== "添乗員") {
      staffByName.set(first, staffByName.get(first) ?? "driver");
      staffByName.set(second, staffByName.get(second) ?? "attendant");
    }
  }

  return [...staffByName.entries()].map(([name, role], index) => ({
    id: stableId("staff", name, index),
    name,
    role,
  }));
}

function parseUsers(sheet1Rows: Row[], sheet3Rows: Row[]): User[] {
  const userRows = [...extractUserRows(sheet1Rows), ...extractSheet3UserRows(sheet3Rows)];
  const seen = new Set<string>();
  const users: User[] = [];

  for (const row of userRows) {
    const name = cellText(row.name);
    if (!name || seen.has(name)) {
      continue;
    }
    seen.add(name);
    users.push({
      id: stableId("user", name, users.length),
      name,
      gender: cellText(row.gender),
      servicePattern: cellText(row.servicePattern),
      phone: cellText(row.phone),
      address: cellText(row.address),
      wheelchairRequired: isMarked(row.wheelchair),
      medicineCheckRequired: isMarked(row.medicine),
      note: cellText(row.note),
    });
  }

  return users;
}

function parseRideStopsForSection(
  rows: Row[],
  section: RideSection,
  ridePlanId: string,
  users: User[],
): RideStop[] {
  const usersByName = new Map(users.map((user) => [user.name, user]));
  const userRows = extractUserRowsInRange(
    rows,
    section.headerIndex,
    section.dataStartIndex,
    section.dataEndIndex,
  );
  const stops: RideStop[] = [];

  for (const row of userRows) {
    const user = usersByName.get(cellText(row.name));
    if (!user) {
      continue;
    }

    stops.push({
      id: stableId("stop", `${ridePlanId}-${user.id}`, stops.length),
      ridePlanId,
      userId: user.id,
      order: stops.length + 1,
      scheduledTime: normalizeTime(cellText(row.scheduledTime)),
      address: cellText(row.address),
      phone: cellText(row.phone),
      note: cellText(row.note),
      status: "planned",
      events: [],
    });
  }

  return stops;
}

function buildRidePlan(
  section: RideSection,
  vehicles: Vehicle[],
  staff: Staff[],
): RidePlan {
  const metadata = section.metadata;
  const vehicle = vehicles.find((item) => item.name === metadata.vehicleName);
  const driver = staff.find((item) => item.name === metadata.driverName);
  const attendant = staff.find((item) => item.name === metadata.attendantName);

  return {
    id: stableId(
      "plan",
      `${metadata.serviceDate ?? "unknown"}-${metadata.period}-${metadata.vehicleName ?? "vehicle"}`,
      section.index,
    ),
    serviceDate: metadata.serviceDate,
    weekday: metadata.weekday,
    period: metadata.period as RidePeriod,
    vehicleId: vehicle?.id,
    driverId: driver?.id,
    attendantId: attendant?.id,
    weather: metadata.weather,
    status: "ready",
  };
}

function extractUserRows(rows: Row[]) {
  return extractRowsByHeaders(rows);
}

function extractSheet3UserRows(rows: Row[]) {
  return extractUserRows(rows);
}

type UserRow = {
  servicePattern?: CellValue;
  name?: CellValue;
  gender?: CellValue;
  wheelchair?: CellValue;
  medicine?: CellValue;
  scheduledTime?: CellValue;
  phone?: CellValue;
  note?: CellValue;
  address?: CellValue;
};

function extractRowsByHeaders(rows: Row[]): UserRow[] {
  const headerIndex = findUserHeaderIndex(rows, 0, rows.length);

  if (headerIndex === undefined) {
    return [];
  }

  return extractUserRowsInRange(rows, headerIndex, headerIndex + 1, rows.length);
}

function extractUserRowsInRange(
  rows: Row[],
  headerIndex: number,
  dataStartIndex: number,
  dataEndIndex: number,
): UserRow[] {
  const header = rows[headerIndex].map(cellText);
  const indexes = Object.fromEntries(
    Object.entries(userHeaderLabels).map(([key, candidates]) => [
      key,
      header.findIndex((cell) =>
        candidates.some((candidate) => String(cell ?? "").includes(candidate)),
      ),
    ]),
  ) as Record<keyof UserRow, number>;

  return rows
    .slice(dataStartIndex, dataEndIndex)
    .map((row) => ({
      servicePattern: valueAt(row, indexes.servicePattern),
      name: valueAt(row, indexes.name),
      gender: valueAt(row, indexes.gender),
      wheelchair: valueAt(row, indexes.wheelchair),
      medicine: valueAt(row, indexes.medicine),
      scheduledTime: valueAt(row, indexes.scheduledTime),
      phone: valueAt(row, indexes.phone),
      note: valueAt(row, indexes.note),
      address: valueAt(row, indexes.address),
    }))
    .filter((row) => isUserRow(row.name, row.servicePattern));
}

function findUserHeaderIndex(rows: Row[], startIndex: number, endIndex: number): number | undefined {
  const index = rows.slice(startIndex, endIndex).findIndex((row) => {
    const text = row.map(cellText);
    return (
      text.some((cell) => userHeaderLabels.servicePattern.includes(cell)) &&
      text.some((cell) => userHeaderLabels.address.includes(cell))
    );
  });
  return index >= 0 ? startIndex + index : undefined;
}

function isSectionStart(row: Row): boolean {
  return hasLabel(row, "車両") && hasLabel(row, "運転手") && Boolean(valueAfterLabel(row, "車両"));
}

function hasLabel(row: Row, label: string): boolean {
  return row.some((cell) => cellText(cell) === label);
}

function valueAfterLabel(row: Row, label: string): string | undefined {
  const index = row.findIndex((cell) => cellText(cell) === label);
  if (index < 0) {
    return undefined;
  }
  return firstNonEmpty(row.slice(index + 1, index + 4));
}

function findPeriod(rows: Row[], startIndex: number, endIndex: number): RidePeriod | undefined {
  for (const row of rows.slice(startIndex, endIndex)) {
    if (row.some((cell) => cellText(cell) === "PM")) {
      return "PM";
    }
    if (row.some((cell) => cellText(cell) === "AM")) {
      return "AM";
    }
  }
  return undefined;
}

function findTotalRowIndex(rows: Row[], startIndex: number, endIndex: number): number | undefined {
  const index = rows.slice(startIndex, endIndex).findIndex((row) =>
    row.some((cell) => cellText(cell).includes("合計人数")),
  );
  return index >= 0 ? startIndex + index : undefined;
}

function isUserRow(name: CellValue, servicePattern: CellValue): boolean {
  const nameText = cellText(name);
  const patternText = cellText(servicePattern);
  return Boolean(
    nameText &&
      !["氏名", "名前", "お迎え", "お送り"].includes(nameText) &&
      patternText &&
      patternText !== "利用日",
  );
}

function valueAt(row: Row, index: number): CellValue {
  return index >= 0 ? row[index] : "";
}

function firstDateLike(row: Row): string | undefined {
  return row.map(cellText).find((value) => /\d{4}[/-]\d{1,2}[/-]\d{1,2}/.test(value));
}

function firstNonEmpty(values: CellValue[]): string | undefined {
  return values.map(cellText).find(Boolean);
}

function cellText(value: CellValue): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function isMarked(value: CellValue): boolean {
  const text = cellText(value);
  return text === "〇" || text === "○" || text.toLowerCase() === "true";
}

function normalizeTime(value: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return value;
  }
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function stableId(prefix: string, value: string, index: number): string {
  const slug = value
    .normalize("NFKC")
    .replace(/\s+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]/gu, "")
    .slice(0, 32);
  return `${prefix}-${index + 1}-${slug || "item"}`;
}
