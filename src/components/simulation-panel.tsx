import { AlertTriangle, PlayCircle } from "lucide-react";
import type { RideImportResult } from "@/lib/ride/types";
import { getSimulationChecklist } from "@/lib/simulation/scenario";

type SimulationPanelProps = {
  data: RideImportResult;
  busy: boolean;
  onLoadScenario: () => void;
  onClearData: () => void;
};

export function SimulationPanel({ data, busy, onLoadScenario, onClearData }: SimulationPanelProps) {
  const checklist = getSimulationChecklist();
  const wheelchairUsers = data.users.filter((user) => user.wheelchairRequired).length;
  const medicineUsers = data.users.filter((user) => user.medicineCheckRequired).length;
  const cancelCandidates = data.rideStops.filter((stop) => stop.note?.includes("キャンセル")).length;

  return (
    <section className="section" aria-labelledby="simulation-title">
      <div className="panel">
        <div className="panel-body grid">
          <div className="brand-row">
            <div>
              <h2 id="simulation-title">デモシナリオ</h2>
              <p className="subtle">
                1日の運行に必要なデータをまとめて入れ、現場の流れを再現します。
              </p>
            </div>
            <button className="primary-button compact-button" type="button" disabled={busy} onClick={onLoadScenario}>
              <PlayCircle size={18} /> {busy ? "読み込み中..." : "デモデータを読み込む"}
            </button>
            <button className="danger-button compact-button" type="button" disabled={busy} onClick={onClearData}>
              データを消去
            </button>
          </div>

          <div className="summary-row">
            <Metric label="利用者" value={data.users.length} />
            <Metric label="車両" value={data.vehicles.length} />
            <Metric label="職員" value={data.staff.length} />
            <Metric label="配車" value={data.ridePlans.length} />
            <Metric label="停車" value={data.rideStops.length} />
            <Metric label="車いす" value={wheelchairUsers} />
            <Metric label="服薬" value={medicineUsers} />
            <Metric label="キャンセル候補" value={cancelCandidates} />
          </div>

          <div className="notice">
            <AlertTriangle size={18} />
            この画面のデータはデモ用です。実運用の操作手順に合わせて確認してください。
          </div>
        </div>
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
