"use client";

import { ArrowLeft, Check, ClipboardCheck, LogIn, LogOut, MapPin, Phone, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { maskAddress, maskName, maskPhone } from "@/lib/privacy/mask";
import type { RideEvent, RideImportResult, RidePlan, RideStop } from "@/lib/ride/types";

type DriverViewProps = {
  plan?: RidePlan;
  stops: RideStop[];
  data: RideImportResult;
  masked: boolean;
  onEvent: (stop: RideStop, eventType: RideEvent["eventType"], note?: string) => void;
  onUndo: (stop: RideStop) => void;
};

export function DriverView({ plan, stops, data, masked, onEvent, onUndo }: DriverViewProps) {
  const [showContact, setShowContact] = useState(false);

  if (!plan || stops.length === 0) {
    return <div className="empty">ドライバー画面を表示するには送迎表を取り込んでください。</div>;
  }

  const nextStop = stops.find((stop) => !["completed", "skipped"].includes(stop.status));
  const remaining = stops.filter((stop) => !["completed", "skipped"].includes(stop.status)).length;

  if (!nextStop) {
    return (
      <section className="driver-card panel">
        <div className="panel-body next-stop">
          <h2>担当便は完了しました</h2>
          <p className="subtle">実績画面で予定時刻と実績時刻を確認できます。</p>
        </div>
      </section>
    );
  }

  const user = data.users.find((item) => item.id === nextStop.userId);
  const userIndex = data.users.findIndex((item) => item.id === nextStop.userId);
  const displayName = masked ? maskName(user?.name ?? "", userIndex) : user?.name;
  const displayAddress = masked ? maskAddress(nextStop.address) : nextStop.address;
  const displayPhone = masked ? maskPhone(nextStop.phone) : nextStop.phone;
  const primaryAction = getPrimaryAction(nextStop.status);
  const remainingStops = stops.filter((stop) => !["completed", "skipped"].includes(stop.status));

  return (
    <section className="driver-phone" aria-labelledby="driver-title">
      <div className="driver-status-strip">
        <span>{plan.period}便</span>
        <strong>残り {remaining}名</strong>
        <span>{nextStop.scheduledTime ?? "--:--"}</span>
      </div>

      <div className="driver-next-card">
        <div className="driver-next-head">
          <div>
            <div className="subtle">次の訪問先</div>
            <h2 id="driver-title">{displayName}</h2>
          </div>
          <StatusBadge status={nextStop.status} />
        </div>
        <div className="driver-stop-detail">
          <div>
            <MapPin size={20} aria-hidden="true" />
            <span>{displayAddress || "住所未登録"}</span>
          </div>
          <div>
            <Phone size={20} aria-hidden="true" />
            <span>{displayPhone || "電話未登録"}</span>
          </div>
        </div>
        <div className="driver-note">
          <strong>注意</strong>
          <span>{nextStop.note || "特記事項なし"}</span>
        </div>
      </div>

      <div className="driver-primary-panel">
        <div>
          <div className="subtle">今押すボタン</div>
          <p>停車してから操作してください。</p>
        </div>
        {primaryAction ? (
          <button
            className="primary-button driver-main-action"
            type="button"
            onClick={() => onEvent(nextStop, primaryAction.eventType)}
          >
            {primaryAction.icon} {primaryAction.label}
          </button>
        ) : (
          <div className="driver-complete-message">この訪問先は記録済みです。</div>
        )}
      </div>

      <div className="driver-sub-actions">
        <button className="secondary-button" type="button" onClick={() => setShowContact((current) => !current)}>
          <ClipboardCheck size={16} /> {showContact ? "連絡先を閉じる" : "連絡先確認"}
        </button>
        <button className="secondary-button" type="button" disabled={nextStop.events.length === 0} onClick={() => onUndo(nextStop)}>
          <RotateCcw size={16} /> 直前取消
        </button>
        <button className="danger-button" type="button" disabled={nextStop.status !== "planned"} onClick={() => onEvent(nextStop, "skip", "ドライバー画面でキャンセル")}>
          <ArrowLeft size={16} /> キャンセル
        </button>
      </div>

      {showContact ? (
        <div className="driver-contact-panel" aria-label="連絡先と注意事項">
          <div>
            <span className="subtle">利用者</span>
            <strong>{displayName}</strong>
          </div>
          <div>
            <span className="subtle">電話</span>
            <strong>{displayPhone || "未登録"}</strong>
          </div>
          <div>
            <span className="subtle">住所</span>
            <strong>{displayAddress || "未登録"}</strong>
          </div>
          <div>
            <span className="subtle">注意事項</span>
            <strong>{nextStop.note || "なし"}</strong>
          </div>
        </div>
      ) : null}

      <div className="driver-step-panel">
        <h3>操作の順番</h3>
        <div className="driver-actions">
          <button
            className="driver-action-button"
            type="button"
            disabled={nextStop.status !== "planned"}
            onClick={() => onEvent(nextStop, "arrive")}
          >
            <LogIn size={20} /> 到着
          </button>
          <button
            className="driver-action-button"
            type="button"
            disabled={nextStop.status !== "arrived"}
            onClick={() => onEvent(nextStop, "board")}
          >
            <Check size={20} /> 乗降
          </button>
          <button
            className="driver-action-button"
            type="button"
            disabled={nextStop.status !== "boarded"}
            onClick={() => onEvent(nextStop, "depart")}
          >
            <LogOut size={20} /> 出発
          </button>
          <button
            className="driver-action-button"
            type="button"
            disabled={nextStop.status !== "departed"}
            onClick={() => onEvent(nextStop, "complete")}
          >
            <Check size={20} /> 完了
          </button>
        </div>
      </div>

      <div className="driver-list-panel">
        <h3>このあと</h3>
        <ol>
          {remainingStops.slice(0, 4).map((stop, index) => {
            const stopUser = data.users.find((item) => item.id === stop.userId);
            const stopUserIndex = data.users.findIndex((item) => item.id === stop.userId);
            return (
              <li key={stop.id} aria-current={stop.id === nextStop.id ? "step" : undefined}>
                <span>{index + 1}</span>
                <strong>{masked ? maskName(stopUser?.name ?? "", stopUserIndex) : stopUser?.name}</strong>
                <small>{stop.scheduledTime ?? "--:--"}</small>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function getPrimaryAction(status: RideStop["status"]): {
  eventType: RideEvent["eventType"];
  label: string;
  icon: ReactNode;
} | undefined {
  switch (status) {
    case "planned":
      return { eventType: "arrive", label: "到着した", icon: <LogIn size={30} /> };
    case "arrived":
      return { eventType: "board", label: "乗った / 降りた", icon: <Check size={30} /> };
    case "boarded":
      return { eventType: "depart", label: "出発する", icon: <LogOut size={30} /> };
    case "departed":
      return { eventType: "complete", label: "完了した", icon: <Check size={30} /> };
    case "completed":
    case "skipped":
      return undefined;
  }
}
