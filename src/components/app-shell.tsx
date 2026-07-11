import type { ReactNode } from "react";

export type Role = "admin" | "facility" | "driver";

const roleProfiles: Record<Role, { title: string; description: string }> = {
  admin: {
    title: "管理者画面",
    description: "配車、登録、進捗、出力をまとめて扱う運用画面です。",
  },
  facility: {
    title: "施設職員画面",
    description: "施設側で必要な進捗確認だけを表示します。",
  },
  driver: {
    title: "ドライバー画面",
    description: "運行中に必要な操作だけを出すスマホ前提の画面です。",
  },
};

type AppShellProps = {
  role: Role;
  masked: boolean;
  serviceDate?: string;
  weather?: string;
  children: ReactNode;
  onMaskedChange: (masked: boolean) => void;
};

export function AppShell({
  role,
  masked,
  serviceDate,
  weather,
  children,
  onMaskedChange,
}: AppShellProps) {
  const profile = roleProfiles[role];

  return (
    <div className={`app role-${role}`}>
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-row">
            <div>
              <h1 className="brand">{profile.title}</h1>
              <div className="subtle">{profile.description}</div>
            </div>
            <label className="subtle">
              <input
                type="checkbox"
                checked={masked}
                onChange={(event) => onMaskedChange(event.target.checked)}
              />{" "}
              匿名表示
            </label>
          </div>
          <div className="meta-row">
            <div className="subtle">
              {serviceDate ? `運行日: ${serviceDate}` : "運行日: 未設定"}
              {weather ? ` / 天候: ${weather}` : ""}
            </div>
          </div>
          {role === "driver" ? (
            <div className="driver-shell-hint" role="status">
              スマホで次の1件だけを見せる構成です。
            </div>
          ) : null}
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
