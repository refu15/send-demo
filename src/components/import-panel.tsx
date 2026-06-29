"use client";

import { useState } from "react";
import { importRideWorkbook } from "@/lib/excel/importer";
import type { RideImportResult } from "@/lib/ride/types";

type ImportPanelProps = {
  result: RideImportResult;
  masked: boolean;
  onImport: (result: RideImportResult) => void;
};

export function ImportPanel({ result, masked, onImport }: ImportPanelProps) {
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | null) {
    if (!file) {
      return;
    }

    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      onImport(await importRideWorkbook(buffer));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section" aria-labelledby="import-title">
      <div className="panel">
        <div className="panel-body grid">
          <div>
            <h2 id="import-title">Excel送迎表を取り込む</h2>
            <p className="subtle">
              `up1送迎表.xlsm` を選択してください。ファイルはブラウザ内で解析し、外部送信しません。
            </p>
          </div>
          <input
            className="file-input"
            type="file"
            accept=".xls,.xlsx,.xlsm"
            disabled={busy}
            onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
          />
          <div className="notice">
            {masked
              ? "デモ表示: 氏名・電話・住所は画面上でマスクします。"
              : "通常表示: 実名・電話・住所が表示されます。画面共有時は注意してください。"}
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="panel">
          <div className="panel-body">
            <h3>取込結果</h3>
            <div className="summary-row">
              <Metric label="車両" value={result.vehicles.length} />
              <Metric label="職員" value={result.staff.length} />
              <Metric label="利用者" value={result.users.length} />
              <Metric label="便" value={result.ridePlans.length} />
              <Metric label="停留所" value={result.rideStops.length} />
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <h3>確認が必要な項目</h3>
            {result.errors.length === 0 && result.warnings.length === 0 ? (
              <p className="subtle">現在、取込エラーはありません。</p>
            ) : (
              <ul>
                {[...result.errors, ...result.warnings].map((error, index) => (
                  <li key={`${error.code}-${index}`}>{error.message}</li>
                ))}
              </ul>
            )}
          </div>
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
