import {
  AlertTriangle,
  BusFront,
  CheckCircle2,
  Download,
  ListChecks,
  Monitor,
  Route,
} from "lucide-react";
import type { ReactNode } from "react";
import { summarizeRideStops } from "@/lib/ride/summary";
import type { RideImportResult } from "@/lib/ride/types";

type OperationsOverviewProps = {
  data: RideImportResult;
  onGoToPlan: () => void;
  onGoToDriver: () => void;
  onGoToProgress: () => void;
  onGoToResults: () => void;
  onGoToExport: () => void;
  onGoToSimulation: () => void;
};

export function OperationsOverview({
  data,
  onGoToPlan,
  onGoToDriver,
  onGoToProgress,
  onGoToResults,
  onGoToExport,
  onGoToSimulation,
}: OperationsOverviewProps) {
  if (data.ridePlans.length === 0) {
    return (
      <section className="section" aria-labelledby="operations-title">
        <div className="empty">
          送迎データがありません。現場シミュレーションから今日のデータを用意してください。
        </div>
        <button className="primary-button operation-primary" type="button" onClick={onGoToSimulation}>
          現場データを用意する
        </button>
      </section>
    );
  }

  const summary = summarizeRideStops(data.rideStops);
  const attention = getAttentionItems(data);
  const nextStop = data.rideStops.find((stop) => !["completed", "skipped"].includes(stop.status));
  const nextPlan = nextStop ? data.ridePlans.find((plan) => plan.id === nextStop.ridePlanId) : undefined;
  const nextVehicle = nextPlan ? data.vehicles.find((vehicle) => vehicle.id === nextPlan.vehicleId) : undefined;

  return (
    <section className="section" aria-labelledby="operations-title">
      <div className="operation-hero panel">
        <div className="panel-body operation-hero-body">
          <div className="operation-copy">
            <div className="operation-kicker">現場用デモ</div>
            <h2 id="operations-title">今日の送迎を上から順番に進める</h2>
            <p>
              朝の確認、車の運行、施設側の見守り、帰着後の実績確認までを、現場の順番で確認します。
            </p>
          </div>
          <div className="operation-now" aria-label="現在の運行状況">
            <span>次に見るところ</span>
            <strong>{nextStop ? `${nextStop.scheduledTime ?? "--:--"} ${nextVehicle?.name ?? "車両未設定"}` : "全便完了"}</strong>
            <small>{nextStop ? "ドライバー画面で次の訪問先を確認します。" : "実績画面で結果を確認します。"}</small>
          </div>
        </div>
      </div>

      <div className="summary-row operation-metrics" aria-label="今日の件数">
        <Metric label="未出発" value={summary.planned} />
        <Metric label="送迎中" value={summary.inProgress} />
        <Metric label="完了" value={summary.completed} />
        <Metric label="残り" value={summary.remaining} />
        <Metric label="キャンセル" value={summary.skipped} />
      </div>

      <div className="operation-grid">
        <OperationStep
          number="1"
          title="朝の確認"
          body="車、担当者、停車順、注意事項を確認します。"
          icon={<Route size={22} />}
          buttonLabel="配車を確認"
          onClick={onGoToPlan}
        />
        <OperationStep
          number="2"
          title="車で使う"
          body="停車中に、到着、乗車/降車、出発、完了を押します。"
          icon={<BusFront size={22} />}
          buttonLabel="ドライバー画面"
          primary
          onClick={onGoToDriver}
        />
        <OperationStep
          number="3"
          title="施設で見る"
          body="未出発、送迎中、完了、キャンセルを車ごとに確認します。"
          icon={<Monitor size={22} />}
          buttonLabel="進捗を見る"
          onClick={onGoToProgress}
        />
        <OperationStep
          number="4"
          title="終わった後"
          body="予定時刻と実績時刻を見比べます。"
          icon={<CheckCircle2 size={22} />}
          buttonLabel="実績を見る"
          onClick={onGoToResults}
        />
        <OperationStep
          number="5"
          title="記録を出す"
          body="送迎表と実績CSVを確認用に出力します。"
          icon={<Download size={22} />}
          buttonLabel="出力する"
          onClick={onGoToExport}
        />
      </div>

      <div className="panel">
        <div className="panel-body operation-attention">
          <div>
            <h3>今日の注意</h3>
            <p className="subtle">車いす、薬確認、キャンセル想定など、朝礼で見る項目です。</p>
          </div>
          <ul className="attention-list">
            {attention.map((item) => (
              <li key={item}>
                <AlertTriangle size={18} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function OperationStep({
  number,
  title,
  body,
  icon,
  buttonLabel,
  primary,
  onClick,
}: {
  number: string;
  title: string;
  body: string;
  icon: ReactNode;
  buttonLabel: string;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <article className="panel operation-step-card">
      <div className="panel-body">
        <div className="operation-step-head">
          <span className="operation-number">{number}</span>
          <span className="operation-icon" aria-hidden="true">{icon}</span>
        </div>
        <h3>{title}</h3>
        <p>{body}</p>
        <button
          className={`${primary ? "primary-button" : "secondary-button"} operation-action`}
          type="button"
          onClick={onClick}
        >
          <ListChecks size={18} /> {buttonLabel}
        </button>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric operation-metric">
      <span className="subtle">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getAttentionItems(data: RideImportResult) {
  const wheelchairUsers = data.users.filter((user) => user.wheelchairRequired).length;
  const medicineUsers = data.users.filter((user) => user.medicineCheckRequired).length;
  const cancelCandidates = data.rideStops.filter((stop) => stop.note?.includes("キャンセル")).length;
  const skipped = data.rideStops.filter((stop) => stop.status === "skipped").length;
  const items = [
    `車いす対応 ${wheelchairUsers}名`,
    `薬確認 ${medicineUsers}名`,
    `キャンセル確認 ${Math.max(cancelCandidates, skipped)}件`,
  ];

  if (data.weather?.includes("雨")) {
    items.unshift("雨天のため乗降場所を確認");
  }

  return items;
}
