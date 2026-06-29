import { BusFront } from "lucide-react";
import type { RideImportResult } from "@/lib/ride/types";

type PlanSelectorProps = {
  data: RideImportResult;
  selectedPlanId?: string;
  onSelectPlan: (planId: string) => void;
};

export function PlanSelector({ data, selectedPlanId, onSelectPlan }: PlanSelectorProps) {
  if (data.ridePlans.length === 0) {
    return null;
  }

  return (
    <div className="panel">
      <div className="panel-body plan-selector">
        <div>
          <h3>操作する送迎便</h3>
          <p className="subtle">配車計画、ドライバー画面、停車順の編集対象を切り替えます。</p>
        </div>
        <label>
          <span className="subtle">送迎便</span>
          <select
            value={selectedPlanId ?? data.ridePlans[0]?.id ?? ""}
            onChange={(event) => onSelectPlan(event.target.value)}
          >
            {data.ridePlans.map((plan) => {
              const vehicle = data.vehicles.find((item) => item.id === plan.vehicleId);
              const driver = data.staff.find((item) => item.id === plan.driverId);
              const stopCount = data.rideStops.filter((stop) => stop.ridePlanId === plan.id).length;
              return (
                <option value={plan.id} key={plan.id}>
                  {plan.serviceDate ?? "日付未設定"} {plan.period} / {vehicle?.name ?? "車両未選択"} /{" "}
                  {driver?.name ?? "ドライバー未選択"} / {stopCount}件
                </option>
              );
            })}
          </select>
        </label>
        <div className="selected-plan-chip">
          <BusFront size={16} />
          {data.ridePlans.find((plan) => plan.id === selectedPlanId)?.period ?? data.ridePlans[0]?.period}
        </div>
      </div>
    </div>
  );
}
