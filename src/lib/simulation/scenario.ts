import type { RideImportResult } from "@/lib/ride/types";

export type SimulationChecklistItem = {
  phase: string;
  actor: string;
  checks: string[];
};

export function createFieldSimulationData(): RideImportResult {
  return {
    serviceDate: "2026-07-01",
    weekday: "水",
    weather: "雨",
    users: [
      {
        id: "sim-user-001",
        name: "山田 花子",
        gender: "女性",
        servicePattern: "月・水・金",
        phone: "03-1111-0001",
        address: "東京都杉並区高井戸東1-1-1",
        wheelchairRequired: true,
        medicineCheckRequired: true,
        note: "玄関前スロープ。乗車前に朝薬の持参確認。",
      },
      {
        id: "sim-user-002",
        name: "佐々木 一郎",
        gender: "男性",
        servicePattern: "水・金",
        phone: "03-1111-0002",
        address: "東京都杉並区浜田山2-2-2",
        wheelchairRequired: false,
        medicineCheckRequired: false,
        note: "耳が遠い。到着時はインターホン後に電話。",
      },
      {
        id: "sim-user-003",
        name: "鈴木 美智子",
        gender: "女性",
        servicePattern: "月・水",
        phone: "03-1111-0003",
        address: "東京都世田谷区北烏山3-3-3",
        wheelchairRequired: false,
        medicineCheckRequired: true,
        note: "薬袋を家族から受け取る。",
      },
      {
        id: "sim-user-004",
        name: "田中 清",
        gender: "男性",
        servicePattern: "水",
        phone: "03-1111-0004",
        address: "東京都世田谷区上北沢4-4-4",
        wheelchairRequired: true,
        medicineCheckRequired: false,
        note: "車いす固定ベルトを使用。",
      },
      {
        id: "sim-user-005",
        name: "小林 和子",
        gender: "女性",
        servicePattern: "水・土",
        phone: "03-1111-0005",
        address: "東京都中野区南台5-5-5",
        wheelchairRequired: false,
        medicineCheckRequired: false,
        note: "当日キャンセル想定。家族連絡済みか確認。",
      },
      {
        id: "sim-user-006",
        name: "渡辺 勇",
        gender: "男性",
        servicePattern: "月・水・金",
        phone: "03-1111-0006",
        address: "東京都中野区弥生町6-6-6",
        wheelchairRequired: false,
        medicineCheckRequired: false,
        note: "雨天時は屋根付き入口で乗車。",
      },
      {
        id: "sim-user-007",
        name: "高橋 節子",
        gender: "女性",
        servicePattern: "水",
        phone: "03-1111-0007",
        address: "東京都練馬区豊玉北7-7-7",
        wheelchairRequired: false,
        medicineCheckRequired: true,
        note: "夕方送り時に連絡帳を家族へ手渡し。",
      },
      {
        id: "sim-user-008",
        name: "伊藤 実",
        gender: "男性",
        servicePattern: "水・金",
        phone: "03-1111-0008",
        address: "東京都練馬区桜台8-8-8",
        wheelchairRequired: false,
        medicineCheckRequired: false,
        note: "独居。送り後の施錠確認。",
      },
      {
        id: "sim-user-009",
        name: "中村 久子",
        gender: "女性",
        servicePattern: "水",
        phone: "03-1111-0009",
        address: "東京都板橋区大山9-9-9",
        wheelchairRequired: true,
        medicineCheckRequired: true,
        note: "段差あり。添乗者が先に降りて介助。",
      },
      {
        id: "sim-user-010",
        name: "加藤 正",
        gender: "男性",
        servicePattern: "月・水",
        phone: "03-1111-0010",
        address: "東京都板橋区常盤台10-10-10",
        wheelchairRequired: false,
        medicineCheckRequired: false,
        note: "集合住宅。駐車位置に注意。",
      },
    ],
    vehicles: [
      { id: "sim-vehicle-001", name: "1号車 ハイゼット", capacity: 6, note: "車いす1台対応" },
      { id: "sim-vehicle-002", name: "2号車 タント", capacity: 4, note: "狭路対応" },
      { id: "sim-vehicle-003", name: "予備車", capacity: 4, note: "故障・遅延時の差し替え" },
    ],
    staff: [
      { id: "sim-staff-001", name: "佐藤 太郎", role: "driver", qualification: "普通二種" },
      { id: "sim-staff-002", name: "井上 葵", role: "attendant", qualification: "介護福祉士" },
      { id: "sim-staff-003", name: "森 健", role: "driver", qualification: "普通二種" },
      { id: "sim-staff-004", name: "長谷川 亮", role: "care", qualification: "初任者研修" },
      { id: "sim-staff-005", name: "施設 管理者", role: "manager" },
    ],
    ridePlans: [
      {
        id: "sim-plan-am-1",
        serviceDate: "2026-07-01",
        weekday: "水",
        period: "AM",
        vehicleId: "sim-vehicle-001",
        driverId: "sim-staff-001",
        attendantId: "sim-staff-002",
        weather: "雨",
        status: "ready",
      },
      {
        id: "sim-plan-am-2",
        serviceDate: "2026-07-01",
        weekday: "水",
        period: "AM",
        vehicleId: "sim-vehicle-002",
        driverId: "sim-staff-003",
        attendantId: "sim-staff-004",
        weather: "雨",
        status: "ready",
      },
      {
        id: "sim-plan-pm-1",
        serviceDate: "2026-07-01",
        weekday: "水",
        period: "PM",
        vehicleId: "sim-vehicle-001",
        driverId: "sim-staff-001",
        attendantId: "sim-staff-002",
        weather: "曇り",
        status: "draft",
      },
    ],
    rideStops: [
      stop("sim-stop-am1-001", "sim-plan-am-1", "sim-user-001", 1, "08:15", "車いす。薬確認。雨天のため玄関前で待機。"),
      stop("sim-stop-am1-002", "sim-plan-am-1", "sim-user-002", 2, "08:28", "電話連絡後に乗車誘導。"),
      stop("sim-stop-am1-003", "sim-plan-am-1", "sim-user-003", 3, "08:42", "薬袋を家族から受け取る。"),
      stop("sim-stop-am1-004", "sim-plan-am-1", "sim-user-004", 4, "08:58", "車いす固定ベルト。"),
      stop("sim-stop-am1-005", "sim-plan-am-1", "sim-user-005", 5, "09:10", "当日キャンセル想定。計画画面で除外確認。"),
      stop("sim-stop-am2-001", "sim-plan-am-2", "sim-user-006", 1, "08:20", "雨天時は屋根付き入口。"),
      stop("sim-stop-am2-002", "sim-plan-am-2", "sim-user-009", 2, "08:36", "段差介助。添乗者が先に降車。"),
      stop("sim-stop-am2-003", "sim-plan-am-2", "sim-user-010", 3, "08:52", "駐車位置に注意。"),
      stop("sim-stop-pm1-001", "sim-plan-pm-1", "sim-user-001", 1, "16:10", "薬返却と連絡帳確認。"),
      stop("sim-stop-pm1-002", "sim-plan-pm-1", "sim-user-003", 2, "16:24", "家族へ薬袋返却。"),
      stop("sim-stop-pm1-003", "sim-plan-pm-1", "sim-user-004", 3, "16:38", "車いす固定解除後、玄関まで介助。"),
      stop("sim-stop-pm1-004", "sim-plan-pm-1", "sim-user-007", 4, "16:52", "連絡帳を家族へ手渡し。"),
      stop("sim-stop-pm1-005", "sim-plan-pm-1", "sim-user-008", 5, "17:06", "送り後の施錠確認。"),
      stop("sim-stop-pm1-006", "sim-plan-pm-1", "sim-user-009", 6, "17:20", "段差介助。"),
    ],
    errors: [],
    warnings: [
      {
        code: "SIMULATION_RISK",
        message: "雨天、車いす、薬確認、当日キャンセル、複数車両を含む現場検証用データです。",
      },
    ],
  };
}

export function getSimulationChecklist(): SimulationChecklistItem[] {
  return [
    {
      phase: "前日準備",
      actor: "管理者",
      checks: [
        "利用者、車両、職員が登録されている",
        "AM/PMの送迎便が分かれている",
        "車いす・薬確認・添乗者の注意事項を配車計画で確認できる",
      ],
    },
    {
      phase: "朝の出発前",
      actor: "管理者",
      checks: [
        "雨天時の注意事項を確認できる",
        "キャンセル者を配車計画で除外できる",
        "ドライバーへ当日の停車順を渡せる",
      ],
    },
    {
      phase: "迎え運行中",
      actor: "ドライバー",
      checks: [
        "到着、乗車、出発、完了を片手操作に近い流れで記録できる",
        "直前の操作を取り消せる",
        "個人情報マスクのON/OFFで表示差を確認できる",
      ],
    },
    {
      phase: "施設到着後",
      actor: "施設職員",
      checks: [
        "進捗画面で未到着者、完了者、キャンセル者を判別できる",
        "薬確認や車いす対応の申し送りを見落とさない",
      ],
    },
    {
      phase: "夕方の送り",
      actor: "管理者・ドライバー",
      checks: [
        "PM便の停車順と連絡帳・施錠確認を追える",
        "実績画面で予定時刻と実績時刻を比較できる",
        "Excel出力で外部共有用の帳票を作れる",
      ],
    },
  ];
}

function stop(
  id: string,
  ridePlanId: string,
  userId: string,
  order: number,
  scheduledTime: string,
  note: string,
) {
  const userAddress: Record<string, string> = {
    "sim-user-001": "東京都杉並区高井戸東1-1-1",
    "sim-user-002": "東京都杉並区浜田山2-2-2",
    "sim-user-003": "東京都世田谷区北烏山3-3-3",
    "sim-user-004": "東京都世田谷区上北沢4-4-4",
    "sim-user-005": "東京都中野区南台5-5-5",
    "sim-user-006": "東京都中野区弥生町6-6-6",
    "sim-user-007": "東京都練馬区豊玉北7-7-7",
    "sim-user-008": "東京都練馬区桜台8-8-8",
    "sim-user-009": "東京都板橋区大山9-9-9",
    "sim-user-010": "東京都板橋区常盤台10-10-10",
  };
  const userPhoneSuffix = userId.slice(-3);

  return {
    id,
    ridePlanId,
    userId,
    order,
    scheduledTime,
    address: userAddress[userId],
    phone: `03-1111-0${userPhoneSuffix}`,
    note,
    status: "planned" as const,
    events: [],
  };
}
