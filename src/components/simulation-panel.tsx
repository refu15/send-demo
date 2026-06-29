import { AlertTriangle, CheckCircle2, ClipboardCheck, PlayCircle, Route } from "lucide-react";
import type { RideImportResult } from "@/lib/ride/types";
import { getSimulationChecklist } from "@/lib/simulation/scenario";

type SimulationPanelProps = {
  data: RideImportResult;
  busy: boolean;
  onLoadScenario: () => void;
  onClearData: () => void;
  onGoToPlan: () => void;
  onGoToDriver: () => void;
  onGoToProgress: () => void;
  onGoToResults: () => void;
};

export function SimulationPanel({
  data,
  busy,
  onLoadScenario,
  onClearData,
  onGoToPlan,
  onGoToDriver,
  onGoToProgress,
  onGoToResults,
}: SimulationPanelProps) {
  const checklist = getSimulationChecklist();
  const wheelchairUsers = data.users.filter((user) => user.wheelchairRequired).length;
  const medicineUsers = data.users.filter((user) => user.medicineCheckRequired).length;
  const cancelCandidates = data.rideStops.filter((stop) => stop.note?.includes("当日キャンセル")).length;

  return (
    <section className="section" aria-labelledby="simulation-title">
      <div className="panel">
        <div className="panel-body grid">
          <div className="brand-row">
            <div>
              <h2 id="simulation-title">現場シミュレーション</h2>
              <p className="subtle">
                実際の一日を想定し、準備、運行、キャンセル、申し送り、実績確認までを通して検証します。
              </p>
            </div>
            <button
              className="primary-button compact-button"
              type="button"
              disabled={busy}
              onClick={onLoadScenario}
            >
              <PlayCircle size={18} /> {busy ? "投入中..." : "現場データを投入"}
            </button>
            <button className="danger-button compact-button" type="button" disabled={busy} onClick={onClearData}>
              デモDBを空にする
            </button>
          </div>

          <div className="summary-row">
            <Metric label="利用者" value={data.users.length} />
            <Metric label="車両" value={data.vehicles.length} />
            <Metric label="送迎便" value={data.ridePlans.length} />
            <Metric label="停車" value={data.rideStops.length} />
            <Metric label="車いす" value={wheelchairUsers} />
            <Metric label="薬確認" value={medicineUsers} />
            <Metric label="キャンセル候補" value={cancelCandidates} />
          </div>

          <div className="notice">
            <AlertTriangle size={18} />
            この操作はデモDBを現場シミュレーション用データに置き換えます。既存の手入力データは消えます。
          </div>
        </div>
      </div>

      <div className="simulation-actions" aria-label="シミュレーション導線">
        <button type="button" className="secondary-button" onClick={onGoToPlan}>
          <Route size={16} /> 配車計画を確認
        </button>
        <button type="button" className="secondary-button" onClick={onGoToDriver}>
          <PlayCircle size={16} /> ドライバー操作へ
        </button>
        <button type="button" className="secondary-button" onClick={onGoToProgress}>
          <ClipboardCheck size={16} /> 進捗を見る
        </button>
        <button type="button" className="secondary-button" onClick={onGoToResults}>
          <CheckCircle2 size={16} /> 実績を見る
        </button>
      </div>

      <div className="simulation-grid">
        {checklist.map((item, index) => (
          <div className="panel" key={item.phase}>
            <div className="panel-body simulation-step">
              <div className="step-index">{index + 1}</div>
              <div>
                <h3>{item.phase}</h3>
                <p className="subtle">{item.actor}</p>
                <ul>
                  {item.checks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <span className="subtle">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
