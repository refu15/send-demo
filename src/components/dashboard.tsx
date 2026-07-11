import { maskName } from "@/lib/privacy/mask";
import { stopsForPlan, summarizeRideStops } from "@/lib/ride/summary";
import type { RideImportResult, RidePlan } from "@/lib/ride/types";

type DashboardProps = {
  data: RideImportResult;
  masked: boolean;
};

export function Dashboard({ data, masked }: DashboardProps) {
  if (data.ridePlans.length === 0) {
    return <EmptyImportMessage />;
  }

  const summary = summarizeRideStops(data.rideStops);
  const activePlans = data.ridePlans.map((plan) => ({
    plan,
    stops: stopsForPlan(plan, data.rideStops),
  }));

  return (
    <section className="section facility-board" aria-labelledby="dashboard-title">
      <div className="facility-hero panel">
        <div className="panel-body">
          <div className="brand-row">
            <div>
              <h2 id="dashboard-title">施設職員ダッシュボード</h2>
              <p className="subtle">
                {data.serviceDate ?? "未設定"} {data.weekday ?? ""} / 天候 {data.weather ?? "未設定"}
              </p>
            </div>
          </div>
          <div className="facility-metrics">
            <Metric label="未出発" value={summary.planned} />
            <Metric label="運行中" value={summary.inProgress} />
            <Metric label="完了" value={summary.completed} />
            <Metric label="キャンセル" value={summary.skipped} />
            <Metric label="残り" value={summary.remaining} />
          </div>
        </div>
      </div>
      <div className="facility-route-grid">
        {activePlans.map(({ plan, stops }) => (
          <FacilityRouteCard data={data} plan={plan} stops={stops} masked={masked} key={plan.id} />
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

function FacilityRouteCard({
  data,
  plan,
  stops,
  masked,
}: {
  data: RideImportResult;
  plan: RidePlan;
  stops: ReturnType<typeof stopsForPlan>;
  masked: boolean;
}) {
  const summary = summarizeRideStops(stops);
  const vehicle = data.vehicles.find((item) => item.id === plan.vehicleId);
  const driver = data.staff.find((item) => item.id === plan.driverId);
  const nextStop = stops.find((stop) => !["completed", "skipped"].includes(stop.status));
  const nextUser = data.users.find((item) => item.id === nextStop?.userId);
  const nextUserIndex = data.users.findIndex((item) => item.id === nextStop?.userId);
  const nextUserName = masked ? maskName(nextUser?.name ?? "", nextUserIndex) : nextUser?.name ?? "未設定";
  const delayedCount = stops.filter((stop) => stop.status === "skipped").length;

  return (
    <article className="facility-route-card">
      <div className="facility-route-head">
        <div>
          <h3>
            {vehicle?.name ?? "未設定車両"} / {plan.period}
          </h3>
          <p className="subtle">運転手 {driver?.name ?? "未設定"}</p>
        </div>
        <strong>{summary.remaining}件</strong>
      </div>
      <div className="facility-next">
        <span>次に見る項目</span>
        <strong>{nextStop ? `${nextStop.scheduledTime ?? "--:--"} ${nextUserName}` : "完了"}</strong>
        <small>{delayedCount > 0 ? `キャンセル ${delayedCount}件あり` : "遅延なし"}</small>
      </div>
      <meter
        className="facility-progress"
        aria-label={`${vehicle?.name ?? "車両"}の進捗`}
        min={0}
        max={Math.max(stops.length, 1)}
        value={summary.completed}
      />
      <div className="summary-row facility-route-stats">
        <Metric label="運行中" value={summary.inProgress} />
        <Metric label="完了" value={summary.completed} />
        <Metric label="キャンセル" value={summary.skipped} />
      </div>
    </article>
  );
}

function EmptyImportMessage() {
  return (
    <div className="empty">
      まだ運行データがありません。先にデモデータを読み込んでください。
    </div>
  );
}
