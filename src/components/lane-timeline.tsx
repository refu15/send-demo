import { StatusBadge } from "@/components/status-badge";
import { maskName } from "@/lib/privacy/mask";
import { summarizeRideStops, stopsForPlan } from "@/lib/ride/summary";
import type { RideImportResult, RidePlan } from "@/lib/ride/types";

type LaneTimelineProps = {
  data: RideImportResult;
  plan: RidePlan;
  masked: boolean;
};

export function LaneTimeline({ data, plan, masked }: LaneTimelineProps) {
  const stops = stopsForPlan(plan, data.rideStops);
  const summary = summarizeRideStops(stops);
  const vehicle = data.vehicles.find((item) => item.id === plan.vehicleId);
  const driver = data.staff.find((item) => item.id === plan.driverId);
  const attendant = data.staff.find((item) => item.id === plan.attendantId);
  const firstActiveId = stops.find((stop) => !["completed", "skipped"].includes(stop.status))?.id;

  return (
    <article className="lane">
      <div className="brand-row">
        <div>
          <h3>{vehicle?.name ?? "車両未設定"} / {plan.period}</h3>
          <div className="subtle">
            運転手: {driver?.name ?? "未設定"} / 添乗員: {attendant?.name ?? "未設定"}
          </div>
        </div>
        <div className="subtle">
          完了 {summary.completed} / 残り {summary.remaining} / キャンセル {summary.skipped}
        </div>
      </div>
      <div className="lane-track" aria-label={`${vehicle?.name ?? "車両"}の送迎レーン`}>
        {stops.map((stop, index) => {
          const user = data.users.find((item) => item.id === stop.userId);
          return (
            <div
              className={`lane-stop ${stop.status} ${firstActiveId === stop.id ? "current" : ""}`}
              key={stop.id}
            >
              <div className="subtle">{stop.order}. {stop.scheduledTime ?? "--:--"}</div>
              <strong>{masked ? maskName(user?.name ?? "", index) : user?.name}</strong>
              <div style={{ marginTop: 6 }}>
                <StatusBadge status={stop.status} />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
