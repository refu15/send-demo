import { ArrowLeft, Check, LogIn, LogOut, Phone, RotateCcw } from "lucide-react";
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

  return (
    <section className="driver-card panel" aria-labelledby="driver-title">
      <div className="panel-body next-stop">
        <div>
          <h2 id="driver-title">ドライバー画面</h2>
          <p className="subtle">
            {plan.period}便 / 残り {remaining}名。操作は停車中に行ってください。
          </p>
        </div>
        <div className="notice">運転中の画面操作は行わないでください。</div>
        <div>
          <div className="subtle">次の訪問先</div>
          <div className="next-stop-time">{nextStop.scheduledTime ?? "--:--"}</div>
          <h3>{masked ? maskName(user?.name ?? "", userIndex) : user?.name}</h3>
          <StatusBadge status={nextStop.status} />
        </div>
        <div className="grid">
          <div>
            <strong>住所</strong>
            <div>{masked ? maskAddress(nextStop.address) : nextStop.address}</div>
          </div>
          <div>
            <strong>電話</strong>
            <div>{masked ? maskPhone(nextStop.phone) : nextStop.phone}</div>
          </div>
          <div>
            <strong>備考</strong>
            <div>{nextStop.note || "なし"}</div>
          </div>
        </div>
        <div className="driver-actions">
          <button
            className="primary-button"
            type="button"
            disabled={nextStop.status !== "planned"}
            onClick={() => onEvent(nextStop, "arrive")}
          >
            <LogIn size={18} /> 到着
          </button>
          <button
            className="primary-button"
            type="button"
            disabled={nextStop.status !== "arrived"}
            onClick={() => onEvent(nextStop, "board")}
          >
            <Check size={18} /> 乗車/降車
          </button>
          <button
            className="primary-button"
            type="button"
            disabled={nextStop.status !== "boarded"}
            onClick={() => onEvent(nextStop, "depart")}
          >
            <LogOut size={18} /> 出発
          </button>
          <button
            className="primary-button"
            type="button"
            disabled={nextStop.status !== "departed"}
            onClick={() => onEvent(nextStop, "complete")}
          >
            <Check size={18} /> 完了
          </button>
          <div className="summary-row">
            <button className="secondary-button" type="button">
              <Phone size={16} /> 電話
            </button>
            <button className="secondary-button" type="button" disabled={nextStop.events.length === 0} onClick={() => onUndo(nextStop)}>
              <RotateCcw size={16} /> 直前取消
            </button>
            <button className="danger-button" type="button" disabled={nextStop.status !== "planned"} onClick={() => onEvent(nextStop, "skip", "ドライバー画面でキャンセル")}>
              <ArrowLeft size={16} /> キャンセル
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
