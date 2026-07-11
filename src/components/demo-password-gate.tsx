"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import type { Role } from "@/components/app-shell";
import {
  DEMO_PASSWORD_SESSION_KEY,
  getExpectedDemoPasswordHash,
  isDemoPasswordGateEnabled,
  verifyDemoPassword,
} from "@/lib/security/demo-password";

type DemoPasswordGateProps = {
  children: ReactNode;
  role: Role;
  onRoleChange: (role: Role) => void;
};

const loginRoles: Array<{ key: Role; label: string; description: string }> = [
  { key: "admin", label: "管理者", description: "今日の運行と配車を確認" },
  { key: "facility", label: "施設職員", description: "施設側で進捗を見る" },
  { key: "driver", label: "ドライバー", description: "車内で送迎を記録" },
];

export function DemoPasswordGate({ children, role, onRoleChange }: DemoPasswordGateProps) {
  const enabled = isDemoPasswordGateEnabled();
  const expectedHash = getExpectedDemoPasswordHash();
  const [password, setPassword] = useState("");
  const [verified, setVerified] = useState(!enabled);
  const [checking, setChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    if (!enabled || !expectedHash) {
      return;
    }
    setVerified(sessionStorage.getItem(DEMO_PASSWORD_SESSION_KEY) === expectedHash);
  }, [enabled, expectedHash]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChecking(true);
    setErrorMessage(undefined);
    try {
      if (await verifyDemoPassword(password, expectedHash)) {
        if (expectedHash) {
          sessionStorage.setItem(DEMO_PASSWORD_SESSION_KEY, expectedHash);
        }
        setVerified(true);
        setPassword("");
        return;
      }
      setErrorMessage("パスワードが一致しません。");
    } finally {
      setChecking(false);
    }
  }

  if (verified) {
    return <>{children}</>;
  }

  return (
    <main className="password-page" aria-labelledby="password-title">
      <form className="password-panel" onSubmit={handleSubmit}>
        <div className="password-icon" aria-hidden="true">
          <LockKeyhole size={28} strokeWidth={2.4} />
        </div>
        <div className="password-copy">
          <h1 id="password-title">送迎支援デモ</h1>
          <p>共有されたデモ用パスワードを入力してください。</p>
        </div>
        <div className="login-role-group" aria-label="ログインする画面">
          <div className="subtle">使う画面を選んでください</div>
          <div className="login-role-list">
            {loginRoles.map((item) => (
              <button
                className="login-role-button"
                type="button"
                aria-pressed={role === item.key}
                onClick={() => onRoleChange(item.key)}
                key={item.key}
              >
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </button>
            ))}
          </div>
        </div>
        <input
          className="credential-helper"
          type="text"
          name="username"
          autoComplete="username"
          value="demo"
          readOnly
          tabIndex={-1}
          aria-hidden="true"
        />
        <label className="password-field">
          パスワード
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            required
          />
        </label>
        {errorMessage ? <div className="password-error">{errorMessage}</div> : null}
        <button className="primary-button" type="submit" disabled={checking}>
          {checking ? "確認中" : "入る"}
        </button>
      </form>
    </main>
  );
}
