import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { importRideWorkbook } from "@/lib/excel/importer";

async function createWorkbookBuffer(): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet1 = workbook.addWorksheet("Sheet1");
  sheet1.addRows([
    [],
    [
      undefined,
      "2026/06/28",
      undefined,
      "日",
      "晴れ",
      undefined,
      undefined,
      "車両",
      "車両A",
      undefined,
      undefined,
      "運転手",
      "田中",
      "添乗員",
      "佐藤",
    ],
    [undefined, "送迎順", "お迎え", undefined, undefined, undefined, undefined, "AM"],
    [
      undefined,
      "利用日",
      "氏名",
      "性別",
      "車椅子",
      "薬確認",
      "連絡",
      "予定時刻",
      "電話",
      undefined,
      "備考欄",
      undefined,
      undefined,
      "住所",
    ],
    [
      undefined,
      "毎回",
      "山田 太郎",
      "男",
      "〇",
      undefined,
      "薬あり",
      "09:00",
      "090-1234-5678",
      undefined,
      "玄関前",
      undefined,
      undefined,
      "東京都サンプル区1-1",
    ],
    [
      undefined,
      "水",
      "鈴木 花子",
      "女",
      undefined,
      "〇",
      undefined,
      "09:20",
      "090-1234-5679",
      undefined,
      "インターホン",
      undefined,
      undefined,
      "東京都サンプル区2-2",
    ],
    ["", "合計人数", "", "2"],
    [
      undefined,
      undefined,
      "リフトアップ車",
      undefined,
      undefined,
      undefined,
      undefined,
      "車両",
      "車両B",
      undefined,
      undefined,
      "運転手",
      "高橋",
      "添乗員",
      "伊藤",
    ],
    [
      undefined,
      "月水土",
      "佐々木 一郎",
      "男",
      undefined,
      "〇",
      "薬あり",
      "09:40",
      "090-1234-5680",
      undefined,
      "車椅子対応",
      undefined,
      undefined,
      "東京都サンプル区3-3",
    ],
    [
      undefined,
      "水",
      "井上 次郎",
      "男",
      undefined,
      "〇",
      undefined,
      "09:55",
      "090-1234-5681",
      undefined,
      "玄関前",
      undefined,
      undefined,
      "東京都サンプル区4-4",
    ],
    ["", "合計人数", "", "2"],
  ]);

  const sheet2 = workbook.addWorksheet("Sheet2");
  sheet2.addRows([
    ["車両", "車両A", undefined, undefined, "車両", "車両B"],
    ["運転手", "添乗員"],
    ["田中", "佐藤"],
    ["高橋", "伊藤"],
  ]);

  const sheet3 = workbook.addWorksheet("Sheet3");
  sheet3.addRows([
    ["事業所", "デモ事業所"],
    ["利用日", "氏名", "性別", "車椅子", "薬確認", "連絡", "予定時刻", "電話", undefined, "備考欄", undefined, undefined, "住所"],
    ["毎回", "山田 太郎", "男", "〇", undefined, "薬あり", "09:00", "090-1234-5678", undefined, "玄関前", undefined, undefined, "東京都サンプル区1-1"],
  ]);

  return workbook.xlsx.writeBuffer();
}

describe("importRideWorkbook", () => {
  it("imports ride plans, stops, vehicles, staff, and users from a workbook", async () => {
    const result = await importRideWorkbook(await createWorkbookBuffer());

    expect(result.errors).toEqual([]);
    expect(result.vehicles.map((vehicle) => vehicle.name)).toContain("車両A");
    expect(result.staff.map((staff) => staff.name)).toContain("田中");
    expect(result.staff.map((staff) => staff.name)).toContain("佐藤");
    expect(result.users).toHaveLength(4);
    expect(result.ridePlans).toHaveLength(2);
    expect(result.ridePlans[0].period).toBe("AM");
    expect(result.rideStops).toHaveLength(4);
    expect(result.rideStops.filter((stop) => stop.ridePlanId === result.ridePlans[0].id)).toHaveLength(2);
    expect(result.rideStops.filter((stop) => stop.ridePlanId === result.ridePlans[1].id)).toHaveLength(2);
    expect(result.ridePlans.map((plan) => result.vehicles.find((vehicle) => vehicle.id === plan.vehicleId)?.name)).toEqual([
      "車両A",
      "車両B",
    ]);
    expect(result.rideStops[0]).toMatchObject({
      order: 1,
      scheduledTime: "09:00",
      status: "planned",
      note: "玄関前",
    });
  });

  it("returns a structured error when required sheets are missing", async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet("Sheet1");
    const result = await importRideWorkbook(await workbook.xlsx.writeBuffer());

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "missing_sheet",
          message: "Sheet2 が見つかりません。",
        }),
        expect.objectContaining({
          code: "missing_sheet",
          message: "Sheet3 が見つかりません。",
        }),
      ]),
    );
  });
});
