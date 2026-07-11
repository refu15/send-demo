import {
  Bus,
  CalendarPlus,
  ClipboardList,
  Download,
  LayoutDashboard,
  Monitor,
  PlayCircle,
  Route,
  Users,
  ClipboardCheck,
} from "lucide-react";
import type { ReactNode } from "react";

export type Role = "admin" | "facility" | "driver";
export type ViewKey =
  | "operations"
  | "dashboard"
  | "masters"
  | "planner"
  | "plan"
  | "driver"
  | "progress"
  | "results"
  | "simulation"
  | "export";

const views: Array<{ key: ViewKey; label: string; icon: ReactNode }> = [
  { key: "operations", label: "今日の運行", icon: <ClipboardCheck size={16} /> },
  { key: "simulation", label: "現場シミュレーション", icon: <PlayCircle size={16} /> },
  { key: "dashboard", label: "ダッシュボード", icon: <LayoutDashboard size={16} /> },
  { key: "masters", label: "マスタ", icon: <Users size={16} /> },
  { key: "planner", label: "計画作成", icon: <CalendarPlus size={16} /> },
  { key: "plan", label: "配車計画", icon: <Route size={16} /> },
  { key: "driver", label: "ドライバー", icon: <Bus size={16} /> },
  { key: "progress", label: "進捗", icon: <Monitor size={16} /> },
  { key: "results", label: "実績", icon: <ClipboardList size={16} /> },
  { key: "export", label: "Excel出力", icon: <Download size={16} /> },
];

const roles: Array<{ key: Role; label: string }> = [
  { key: "admin", label: "管理者" },
  { key: "facility", label: "施設職員" },
  { key: "driver", label: "ドライバー" },
];

type AppShellProps = {
  role: Role;
  view: ViewKey;
  masked: boolean;
  serviceDate?: string;
  weather?: string;
  children: ReactNode;
  onRoleChange: (role: Role) => void;
  onViewChange: (view: ViewKey) => void;
  onMaskedChange: (masked: boolean) => void;
};

export function AppShell({
  role,
  view,
  masked,
  serviceDate,
  weather,
  children,
  onRoleChange,
  onViewChange,
  onMaskedChange,
}: AppShellProps) {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-row">
            <div>
              <h1 className="brand">送迎レーン</h1>
              <div className="subtle">
                今日の準備、運行、進捗、実績を順番に確認できます。
              </div>
            </div>
            <label className="subtle">
              <input
                type="checkbox"
                checked={masked}
                onChange={(event) => onMaskedChange(event.target.checked)}
              />{" "}
              デモ表示で個人情報をマスク
            </label>
          </div>
          <div className="meta-row">
            <ul className="role-list" aria-label="ロール切替">
              {roles.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    className="role-button"
                    aria-pressed={role === item.key}
                    onClick={() => onRoleChange(item.key)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="subtle">
              {serviceDate ? `対象日: ${serviceDate}` : "対象日: 未取込"}
              {weather ? ` / 天気: ${weather}` : ""}
            </div>
          </div>
          <nav className="nav-row" aria-label="メインナビゲーション">
            <ul className="nav-list">
              {views.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    className="nav-button"
                    aria-current={view === item.key ? "page" : undefined}
                    onClick={() => onViewChange(item.key)}
                  >
                    {item.icon} {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
