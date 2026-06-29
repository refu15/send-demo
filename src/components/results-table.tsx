import { Download } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { maskName } from "@/lib/privacy/mask";
import type { RideImportResult } from "@/lib/ride/types";

type ResultsTableProps = {
  data: RideImportResult;
  masked: boolean;
};

export function ResultsTable({ data, masked }: ResultsTableProps) {
  if (data.rideStops.length === 0) {
    return <div className="empty">実績を表示するには送迎表を取り込んでください。</div>;
  }

  function downloadCsv() {
    const csv = toCsv(data, masked);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ride-results.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="section" aria-labelledby="results-title">
      <div className="brand-row">
        <div>
          <h2 id="results-title">送迎実績</h2>
          <p className="subtle">予定時刻と操作実績を比較します。</p>
        </div>
        <button className="secondary-button" type="button" onClick={downloadCsv}>
          <Download size={16} /> 実績CSVを出力
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>順</th>
              <th>利用者</th>
              <th>状態</th>
              <th>予定</th>
              <th>到着</th>
              <th>乗車/降車</th>
              <th>出発</th>
              <th>完了</th>
            </tr>
          </thead>
          <tbody>
            {data.rideStops.map((stop, index) => {
              const user = data.users.find((item) => item.id === stop.userId);
              return (
                <tr key={stop.id}>
                  <td>{stop.order}</td>
                  <td>{masked ? maskName(user?.name ?? "", index) : user?.name}</td>
                  <td><StatusBadge status={stop.status} /></td>
                  <td>{stop.scheduledTime ?? ""}</td>
                  <td>{timeOnly(stop.actual?.arrivedAt)}</td>
                  <td>{timeOnly(stop.actual?.boardedAt)}</td>
                  <td>{timeOnly(stop.actual?.departedAt)}</td>
                  <td>{timeOnly(stop.actual?.completedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function toCsv(data: RideImportResult, masked: boolean): string {
  const header = ["順", "利用者", "状態", "予定", "到着", "乗車/降車", "出発", "完了"];
  const rows = data.rideStops.map((stop, index) => {
    const user = data.users.find((item) => item.id === stop.userId);
    return [
      stop.order,
      masked ? maskName(user?.name ?? "", index) : user?.name ?? "",
      stop.status,
      stop.scheduledTime ?? "",
      timeOnly(stop.actual?.arrivedAt),
      timeOnly(stop.actual?.boardedAt),
      timeOnly(stop.actual?.departedAt),
      timeOnly(stop.actual?.completedAt),
    ].map(csvCell);
  });

  return [header.map(csvCell), ...rows].map((row) => row.join(",")).join("\r\n");
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function timeOnly(value?: string): string {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
