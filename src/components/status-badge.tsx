import type { RideStopStatus } from "@/lib/ride/types";

const labels: Record<RideStopStatus, string> = {
  planned: "予定",
  arrived: "到着",
  boarded: "乗車/降車",
  departed: "出発",
  completed: "完了",
  skipped: "キャンセル",
};

export function StatusBadge({ status }: { status: RideStopStatus }) {
  return (
    <span className={`status-badge status-${status}`}>
      <span aria-hidden="true">{symbolFor(status)}</span>
      {labels[status]}
    </span>
  );
}

function symbolFor(status: RideStopStatus): string {
  switch (status) {
    case "planned":
      return "○";
    case "arrived":
      return "●";
    case "boarded":
      return "●";
    case "departed":
      return "→";
    case "completed":
      return "✓";
    case "skipped":
      return "×";
  }
}
