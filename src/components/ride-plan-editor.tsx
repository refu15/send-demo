import type { RideImportResult, RidePeriod } from "@/lib/ride/types";

type RidePlanEditorProps = {
  data: RideImportResult;
  onCreatePlan: (input: {
    serviceDate?: string;
    weekday?: string;
    period: RidePeriod;
    vehicleId?: string;
    driverId?: string;
    attendantId?: string;
    weather?: string;
  }) => void;
  onAddStop: (input: {
    ridePlanId: string;
    userId: string;
    scheduledTime?: string;
    note?: string;
  }) => void;
};

export function RidePlanEditor({ data, onCreatePlan, onAddStop }: RidePlanEditorProps) {
  const drivers = data.staff.filter((staff) => staff.role === "driver");
  const attendants = data.staff.filter((staff) => staff.role !== "driver");

  return (
    <section className="section" aria-labelledby="planner-title">
      <div>
        <h2 id="planner-title">計画作成</h2>
        <p className="subtle">
          登録済みマスタから送迎便を作成し、利用者を停車順に追加します。
        </p>
      </div>

      <div className="grid two">
        <div className="panel">
          <form
            className="panel-body form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const formData = new FormData(form);
              onCreatePlan({
                serviceDate: optionalText(formData, "serviceDate"),
                weekday: optionalText(formData, "weekday"),
                period: String(formData.get("period") ?? "AM") as RidePeriod,
                vehicleId: optionalText(formData, "vehicleId"),
                driverId: optionalText(formData, "driverId"),
                attendantId: optionalText(formData, "attendantId"),
                weather: optionalText(formData, "weather"),
              });
              form.reset();
            }}
          >
            <h3>送迎便を作成</h3>
            <div className="form-grid compact">
              <label>
                対象日
                <input name="serviceDate" type="date" />
              </label>
              <label>
                曜日
                <input name="weekday" placeholder="水" />
              </label>
            </div>
            <label>
              区分
              <select name="period" defaultValue="AM">
                <option value="AM">午前</option>
                <option value="PM">午後</option>
              </select>
            </label>
            <label>
              車両
              <select name="vehicleId" defaultValue="">
                <option value="">未選択</option>
                {data.vehicles.map((vehicle) => (
                  <option value={vehicle.id} key={vehicle.id}>
                    {vehicle.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              ドライバー
              <select name="driverId" defaultValue="">
                <option value="">未選択</option>
                {drivers.map((staff) => (
                  <option value={staff.id} key={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              添乗・同乗
              <select name="attendantId" defaultValue="">
                <option value="">未選択</option>
                {attendants.map((staff) => (
                  <option value={staff.id} key={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              天気
              <input name="weather" placeholder="晴れ" />
            </label>
            <button className="primary-button" type="submit">
              送迎便を作成
            </button>
          </form>
        </div>

        <div className="panel">
          <form
            className="panel-body form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const formData = new FormData(form);
              onAddStop({
                ridePlanId: String(formData.get("ridePlanId") ?? ""),
                userId: String(formData.get("userId") ?? ""),
                scheduledTime: optionalText(formData, "scheduledTime"),
                note: optionalText(formData, "note"),
              });
              form.reset();
            }}
          >
            <h3>停車を追加</h3>
            <label>
              送迎便
              <select name="ridePlanId" required defaultValue="">
                <option value="" disabled>
                  選択してください
                </option>
                {data.ridePlans.map((plan) => (
                  <option value={plan.id} key={plan.id}>
                    {plan.serviceDate ?? "日付未設定"} {plan.period}
                  </option>
                ))}
              </select>
            </label>
            <label>
              利用者
              <select name="userId" required defaultValue="">
                <option value="" disabled>
                  選択してください
                </option>
                {data.users.map((user) => (
                  <option value={user.id} key={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              予定時刻
              <input name="scheduledTime" type="time" />
            </label>
            <label>
              備考
              <textarea name="note" rows={3} placeholder="持ち物、乗車位置、確認事項など" />
            </label>
            <button
              className="primary-button"
              type="submit"
              disabled={data.ridePlans.length === 0 || data.users.length === 0}
            >
              停車を追加
            </button>
            {data.ridePlans.length === 0 || data.users.length === 0 ? (
              <div className="notice">先にマスタと送迎便を登録してください。</div>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}

function optionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : undefined;
}
