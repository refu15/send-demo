"use client";

import { useState } from "react";
import { exportRideWorkbook } from "@/lib/excel/exporter";
import type { RideImportResult } from "@/lib/ride/types";

type ExportPanelProps = {
  data: RideImportResult;
};

export function ExportPanel({ data }: ExportPanelProps) {
  const [busy, setBusy] = useState(false);
  const hasData =
    data.users.length > 0 ||
    data.vehicles.length > 0 ||
    data.staff.length > 0 ||
    data.ridePlans.length > 0 ||
    data.rideStops.length > 0;

  async function handleExport() {
    setBusy(true);
    try {
      const buffer = await exportRideWorkbook(data);
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `送迎レーン_${data.serviceDate ?? new Date().toISOString().slice(0, 10)}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section" aria-labelledby="export-title">
      <div className="panel">
        <div className="panel-body grid">
          <div>
            <h2 id="export-title">Excel出力</h2>
            <p className="subtle">
              アプリ内で管理しているマスタ・送迎便・停車順を Excel ブックとして出力します。
            </p>
          </div>
          <div className="summary-row">
            <Metric label="利用者" value={data.users.length} />
            <Metric label="車両" value={data.vehicles.length} />
            <Metric label="職員" value={data.staff.length} />
            <Metric label="送迎便" value={data.ridePlans.length} />
            <Metric label="停車" value={data.rideStops.length} />
          </div>
          <button
            className="primary-button"
            type="button"
            disabled={!hasData || busy}
            onClick={() => void handleExport()}
          >
            {busy ? "出力中..." : "Excelを出力"}
          </button>
          {!hasData ? (
            <div className="notice">先にマスタまたは送迎計画を登録してください。</div>
          ) : null}
        </div>
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
