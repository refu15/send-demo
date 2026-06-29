"use client";

import { ArrowDown, ArrowUp, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { maskAddress, maskName, maskPhone } from "@/lib/privacy/mask";
import type { RideImportResult, RideStop } from "@/lib/ride/types";

type RideStopTableProps = {
  data: RideImportResult;
  masked: boolean;
  selectedPlanId?: string;
  onSkip: (stop: RideStop) => void;
  onUpdate: (stop: RideStop) => void;
  onMove: (stop: RideStop, direction: "up" | "down") => void;
  onDelete: (stop: RideStop) => void;
};

export function RideStopTable({
  data,
  masked,
  selectedPlanId,
  onSkip,
  onUpdate,
  onMove,
  onDelete,
}: RideStopTableProps) {
  const selectedPlan = data.ridePlans.find((plan) => plan.id === selectedPlanId) ?? data.ridePlans[0];
  const stops = selectedPlan
    ? data.rideStops
        .filter((stop) => stop.ridePlanId === selectedPlan.id)
        .sort((a, b) => a.order - b.order)
    : [];

  if (!selectedPlan || stops.length === 0) {
    return <div className="empty">送迎便を選び、計画作成画面で停車を追加してください。</div>;
  }

  return (
    <section className="section" aria-labelledby="plan-title">
      <div>
        <h2 id="plan-title">配車計画</h2>
        <p className="subtle">
          {selectedPlan.serviceDate ?? "日付未設定"} {selectedPlan.period}便。停車順、予定時刻、備考をデモ中に修正できます。
        </p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>順</th>
              <th>予定</th>
              <th>利用者</th>
              <th>状態</th>
              <th>電話</th>
              <th>住所</th>
              <th>備考</th>
              <th>編集</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {stops.map((stop, index) => (
              <RideStopRow
                data={data}
                key={stop.id}
                masked={masked}
                stop={stop}
                index={index}
                isFirst={index === 0}
                isLast={index === stops.length - 1}
                onSkip={onSkip}
                onUpdate={onUpdate}
                onMove={onMove}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RideStopRow({
  data,
  masked,
  stop,
  index,
  isFirst,
  isLast,
  onSkip,
  onUpdate,
  onMove,
  onDelete,
}: {
  data: RideImportResult;
  masked: boolean;
  stop: RideStop;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onSkip: (stop: RideStop) => void;
  onUpdate: (stop: RideStop) => void;
  onMove: (stop: RideStop, direction: "up" | "down") => void;
  onDelete: (stop: RideStop) => void;
}) {
  const user = data.users.find((item) => item.id === stop.userId);
  const [scheduledTime, setScheduledTime] = useState(stop.scheduledTime ?? "");
  const [note, setNote] = useState(stop.note ?? "");

  return (
    <tr>
      <td>
        <div className="order-cell">
          <strong>{stop.order}</strong>
          <button
            aria-label="上へ移動"
            className="icon-button"
            disabled={isFirst}
            type="button"
            onClick={() => onMove(stop, "up")}
          >
            <ArrowUp size={14} />
          </button>
          <button
            aria-label="下へ移動"
            className="icon-button"
            disabled={isLast}
            type="button"
            onClick={() => onMove(stop, "down")}
          >
            <ArrowDown size={14} />
          </button>
        </div>
      </td>
      <td>{stop.scheduledTime ?? "--:--"}</td>
      <td>{masked ? maskName(user?.name ?? "", index) : user?.name}</td>
      <td>
        <StatusBadge status={stop.status} />
      </td>
      <td>{masked ? maskPhone(stop.phone) : stop.phone}</td>
      <td>{masked ? maskAddress(stop.address) : stop.address}</td>
      <td>{stop.note}</td>
      <td>
        <div className="table-edit-grid">
          <input
            aria-label="予定時刻"
            type="time"
            value={scheduledTime}
            onChange={(event) => setScheduledTime(event.target.value)}
          />
          <input
            aria-label="備考"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <button
            className="secondary-button"
            type="button"
            onClick={() => onUpdate({ ...stop, scheduledTime: scheduledTime || undefined, note: note || undefined })}
          >
            <Save size={14} /> 保存
          </button>
        </div>
      </td>
      <td>
        <div className="table-actions">
          <button
            className="danger-button"
            type="button"
            disabled={stop.status !== "planned"}
            onClick={() => {
              if (window.confirm("この利用者をキャンセルにしますか。")) {
                onSkip(stop);
              }
            }}
          >
            キャンセル
          </button>
          <button
            aria-label="停車を削除"
            className="danger-button"
            type="button"
            onClick={() => {
              if (window.confirm("この停車を削除しますか。")) {
                onDelete(stop);
              }
            }}
          >
            <Trash2 size={14} /> 削除
          </button>
        </div>
      </td>
    </tr>
  );
}
