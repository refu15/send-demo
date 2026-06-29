import { LaneTimeline } from "@/components/lane-timeline";
import { summarizeRideStops } from "@/lib/ride/summary";
import type { RideImportResult } from "@/lib/ride/types";

type DashboardProps = {
  data: RideImportResult;
  masked: boolean;
  readonly: boolean;
  onNavigateToDriver: () => void;
};

export function Dashboard({ data, masked, readonly, onNavigateToDriver }: DashboardProps) {
  if (data.ridePlans.length === 0) {
    return <EmptyImportMessage />;
  }

  const summary = summarizeRideStops(data.rideStops);

  return (
    <section className="section" aria-labelledby="dashboard-title">
      <div className="panel">
        <div className="panel-body">
          <div className="brand-row">
            <div>
              <h2 id="dashboard-title">{readonly ? "施設側 進捗モニター" : "当日ダッシュボード"}</h2>
              <p className="subtle">
                {data.serviceDate ?? "日付未設定"} {data.weekday ?? ""} / 天気: {data.weather ?? "未設定"}
              </p>
            </div>
            {!readonly ? (
              <button className="secondary-button" type="button" onClick={onNavigateToDriver}>
                ドライバー画面へ
              </button>
            ) : null}
          </div>
          <div className="summary-row">
            <Metric label="未出発" value={summary.planned} />
            <Metric label="送迎中" value={summary.inProgress} />
            <Metric label="完了" value={summary.completed} />
            <Metric label="キャンセル" value={summary.skipped} />
            <Metric label="残り" value={summary.remaining} />
          </div>
        </div>
      </div>
      {data.ridePlans.map((plan) => (
        <LaneTimeline data={data} plan={plan} masked={masked} key={plan.id} />
      ))}
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

function EmptyImportMessage() {
  return (
    <div className="empty">
      まだ送迎表が取り込まれていません。先に「取込」からExcelファイルを選択してください。
    </div>
  );
}
