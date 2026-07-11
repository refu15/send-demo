import { LaneTimeline } from "@/components/lane-timeline";
import { maskName } from "@/lib/privacy/mask";
import { stopsForPlan, summarizeRideStops } from "@/lib/ride/summary";
import type { RideImportResult, RidePlan } from "@/lib/ride/types";

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
  const activePlans = data.ridePlans.map((plan) => ({
    plan,
    stops: stopsForPlan(plan, data.rideStops),
  }));

  return (
    <section className={`section ${readonly ? "facility-board" : "admin-dashboard"}`} aria-labelledby="dashboard-title">
      <div className={readonly ? "facility-hero panel" : "panel"}>
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
          <div className={readonly ? "facility-metrics" : "summary-row"}>
            <Metric label="未出発" value={summary.planned} />
            <Metric label="送迎中" value={summary.inProgress} />
            <Metric label="完了" value={summary.completed} />
            <Metric label="キャンセル" value={summary.skipped} />
            <Metric label="残り" value={summary.remaining} />
          </div>
        </div>
      </div>
      {readonly ? (
        <div className="facility-route-grid">
          {activePlans.map(({ plan, stops }) => (
            <FacilityRouteCard data={data} plan={plan} stops={stops} masked={masked} key={plan.id} />
          ))}
        </div>
      ) : (
        data.ridePlans.map((plan) => (
          <LaneTimeline data={data} plan={plan} masked={masked} key={plan.id} />
        ))
      )}
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
  const nextUserName = masked ? maskName(nextUser?.name ?? "", nextUserIndex) : nextUser?.name ?? "利用者";
  const delayedCount = stops.filter((stop) => stop.status === "skipped").length;

  return (
    <article className="facility-route-card">
      <div className="facility-route-head">
        <div>
          <h3>{vehicle?.name ?? "車両未設定"} / {plan.period}</h3>
          <p className="subtle">担当: {driver?.name ?? "未設定"}</p>
        </div>
        <strong>{summary.remaining}名待ち</strong>
      </div>
      <div className="facility-next">
        <span>次に確認</span>
        <strong>{nextStop ? `${nextStop.scheduledTime ?? "--:--"} ${nextUserName}` : "完了"}</strong>
        <small>{delayedCount > 0 ? `キャンセル ${delayedCount}件あり` : "通常運行"}</small>
      </div>
      <meter
        className="facility-progress"
        aria-label={`${vehicle?.name ?? "車両"}の進捗`}
        min={0}
        max={Math.max(stops.length, 1)}
        value={summary.completed}
      />
      <div className="summary-row facility-route-stats">
        <Metric label="送迎中" value={summary.inProgress} />
        <Metric label="完了" value={summary.completed} />
        <Metric label="取消" value={summary.skipped} />
      </div>
    </article>
  );
}

function EmptyImportMessage() {
  return (
    <div className="empty">
      まだ送迎表が取り込まれていません。先に「取込」からExcelファイルを選択してください。
    </div>
  );
}
