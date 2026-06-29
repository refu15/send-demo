"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import {
  DEMO_PASSWORD_SESSION_KEY,
  getExpectedDemoPasswordHash,
  isDemoPasswordGateEnabled,
  verifyDemoPassword,
} from "@/lib/security/demo-password";

type DemoPasswordGateProps = {
  children: ReactNode;
};

export function DemoPasswordGate({ children }: DemoPasswordGateProps) {
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
