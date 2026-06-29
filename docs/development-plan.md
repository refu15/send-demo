# 送迎支援デモシステム 開発計画

作成日: 2026-06-28

参照仕様: `docs/requirements.md`

参照テスト計画: `docs/test-plan.md`

参照UX/UI設計: `docs/ux-ui-design.md`

## 1. 目的

アプリ内DBを起点に、利用者・車両・職員管理、送迎計画作成、ドライバー操作、進捗モニター、送迎表Excel出力、実績CSV出力までを縦に通したデモを作る。

この計画は、ユーザー承認後に実装へ入るための作業順序を定義する。承認前にアプリ本体のコードは書かない。

## 2. 開発前提

- 初回デモはローカルPCで動くWebアプリにする
- 画面は日本語
- アプリ内DBをデータの正とする
- Excelはエクスポート形式として扱う
- 地図、GPS、通知、AI最適化は初回スコープ外
- 個人情報を外部APIへ送らない
- 実Excelファイルはリポジトリへコピーしない
- コミットする場合は、テスト通過後に `git diff` を確認する

## 3. アーキテクチャ判断

### A-001 Next.js + TypeScript

理由:

- Excel取込、画面、APIを1つのローカルWebアプリでまとめられる
- デモ画面を早く作れる
- 将来の本番化にもつなぎやすい

### A-002 DBと業務ロジックをUIから分離

理由:

- UIに依存せずマスタ、送迎計画、状態遷移をテストするため
- 将来のAPI化や本番DB移行に備えるため

### A-003 初回はSQLite保存

理由:

- ローカルデモで扱いやすい
- ブラウザリロード後も状態を残せる
- 将来PostgreSQLへ移行しやすい

### A-004 Excelは出力専用

理由:

- Excelを業務の正にすると結合セルや入力規則に引きずられる
- アプリ側で送迎計画と実績履歴を正規化して持つ方が安全
- 外部提出や紙運用にはExcel出力で対応できる

## 4. 依存関係

```text
プロジェクト初期化
  -> 型定義
  -> SQLite/DBモデル
  -> マスタCRUD
  -> 送迎計画CRUD
  -> データ保存
  -> ダッシュボード
  -> 配車計画
  -> ドライバー操作
  -> 進捗モニター
  -> 送迎表Excel
  -> 実績CSV
  -> デモ検証
```

高リスク箇所:

- DBモデル
- マスタCRUD
- 送迎計画CRUD
- 状態遷移
- 個人情報の表示制御

そのため、DBモデル、送迎計画作成、状態遷移は早い段階でテストを作る。

## 5. タスク一覧

### Phase 1: プロジェクト基盤

#### Task 1: Next.jsプロジェクト初期化

説明:

`send-demo` にNext.js、TypeScript、lint、test、buildの基盤を作る。

Acceptance:

- [ ] `npm run dev` でローカル起動できる
- [ ] `npm run lint` が実行できる
- [ ] `npm run test -- --run` が実行できる
- [ ] `npm run build` が通る

Verification:

- [ ] `npm run lint`
- [ ] `npm run test -- --run`
- [ ] `npm run build`

Dependencies:

- なし

Files likely touched:

- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `src/app/page.tsx`
- `src/app/layout.tsx`

Estimated scope:

- M

#### Task 2: 基本レイアウトとロール切替を作る

説明:

管理者、施設職員、ドライバーを切り替えるデモ用ナビゲーションを作る。

Acceptance:

- [ ] 管理者、施設職員、ドライバーの3ロールを切り替えられる
- [ ] 現在ロールが画面上で分かる
- [ ] 本番認証ではないことが分かる

Verification:

- [ ] `npm run lint`
- [ ] 手動確認

Dependencies:

- Task 1

Files likely touched:

- `src/app/page.tsx`
- `src/components/app-shell.tsx`
- `src/components/role-switcher.tsx`
- `src/app/globals.css`

Estimated scope:

- S

#### Task 2.5: UX/UI基盤を定義する

説明:

`docs/ux-ui-design.md` に基づき、デザイントークン、基本余白、状態色、フォーカスリング、送迎レーンの基本スタイルを定義する。

Acceptance:

- [ ] カラートークンが定義されている
- [ ] 基本文字サイズが定義されている
- [ ] 状態ラベルの色と形が定義されている
- [ ] フォーカスリングが見える
- [ ] 375px幅でボタン文字がはみ出さない

Verification:

- [ ] `npm run lint`
- [ ] 手動で375px、768px、1280pxを確認する

Dependencies:

- Task 1

Files likely touched:

- `src/app/globals.css`
- `src/lib/ride/status-labels.ts`
- `src/components/status-badge.tsx`

Estimated scope:

- S

### Checkpoint 1: 基盤確認

- [ ] ローカルURLが開く
- [ ] ロール切替ができる
- [ ] `docs/ux-ui-design.md` の基本トークンが反映されている
- [ ] lint/test/buildが通る

### Phase 2: ドメインモデルとDB管理

#### Task 3: 送迎ドメイン型を定義する

説明:

User、Vehicle、Staff、RidePlan、RideStop、RideEvent、状態遷移の型を定義する。

Acceptance:

- [ ] 要件定義のデータモデルと対応している
- [ ] RideStopStatusとRideEventTypeが定義されている
- [ ] UIから再利用できる

Verification:

- [ ] `npm run test -- --run`
- [ ] `npm run build`

Dependencies:

- Task 1

Files likely touched:

- `src/lib/ride/types.ts`
- `src/lib/ride/status.ts`
- `tests/ride/status.test.ts`

Estimated scope:

- S

#### Task 4: 状態遷移ロジックを実装する

説明:

`planned -> arrived -> boarded -> departed -> completed` と `planned -> skipped` を実装する。

Acceptance:

- [ ] 正常遷移が通る
- [ ] 不正遷移はエラーになる
- [ ] 直前操作取消のためのイベント履歴設計がある

Verification:

- [ ] `npm run test -- --run`

Dependencies:

- Task 3

Files likely touched:

- `src/lib/ride/status.ts`
- `tests/ride/status.test.ts`

Estimated scope:

- S

#### Task 5: SQLite/Prismaのデータモデルを実装する

説明:

Facility、User、Vehicle、Staff、RidePlan、RideStop、RideEventをSQLiteに保存できるようにする。

Acceptance:

- [ ] Prisma schemaが定義されている
- [ ] migrate/dev相当でローカルDBを作成できる
- [ ] User、Vehicle、Staff、RidePlan、RideStop、RideEventを保存できる
- [ ] テスト用DBまたはrepository fakeで保存ロジックを検証できる

Verification:

- [ ] `npm run test -- --run`
- [ ] `npm run build`

Dependencies:

- Task 3

Files likely touched:

- `prisma/schema.prisma`
- `src/lib/db/*`
- `tests/db/*.test.ts`

Estimated scope:

- M

#### Task 6: マスタ管理画面を作る

説明:

利用者、車両、職員をアプリ上で作成・編集・削除できるようにする。

Acceptance:

- [ ] 利用者を作成・編集・削除できる
- [ ] 車両を作成・編集・削除できる
- [ ] 職員を作成・編集・削除できる
- [ ] 削除時に既存計画への影響を確認できる

Verification:

- [ ] `npm run lint`
- [ ] 手動確認

Dependencies:

- Task 5

Files likely touched:

- `src/app/page.tsx`
- `src/components/master-management.tsx`
- `src/lib/db/repositories.ts`

Estimated scope:

- M

#### Task 6.5: 送迎計画作成画面を作る

説明:

アプリ内でAM/PM便を作成し、車両、運転手、添乗員、利用者、送迎順を設定できるようにする。

Acceptance:

- [ ] AM/PM便を作成できる
- [ ] 車両、運転手、添乗員を割り当てられる
- [ ] 利用者を送迎順に追加できる
- [ ] 送迎順を変更できる
- [ ] 予定時刻と備考を編集できる

Verification:

- [ ] `npm run test -- --run`
- [ ] 手動確認

Dependencies:

- Task 6

Files likely touched:

- `src/components/ride-plan-editor.tsx`
- `src/lib/ride/plan-actions.ts`
- `tests/ride/plan-actions.test.ts`

Estimated scope:

- M

### Checkpoint 2: アプリ内管理確認

- [ ] 利用者、車両、職員を登録できる
- [ ] AM/PM便を作成できる
- [ ] 車両、担当者、利用者順を設定できる
- [ ] 個人情報がconsoleへ出力されない
- [ ] lint/test/buildが通る

### Phase 3: 管理者向け計画表示

#### Task 7: ダッシュボードを作る

説明:

日付、曜日、天気、AM/PM、車両別進捗を表示する。

Acceptance:

- [ ] 日付、曜日、天気が表示される
- [ ] AM/PMを切り替えられる
- [ ] 車両別に未出発、送迎中、完了、キャンセル件数が表示される
- [ ] 送迎レーンUIで車両別の現在状態が分かる

Verification:

- [ ] `npm run lint`
- [ ] 手動確認

Dependencies:

- Task 6

Files likely touched:

- `src/components/dashboard.tsx`
- `src/components/vehicle-progress-card.tsx`
- `src/components/lane-timeline.tsx`
- `src/lib/ride/summary.ts`

Estimated scope:

- M

#### Task 8: 配車計画画面を作る

説明:

車両別、送迎順で利用者と予定時刻、備考、車椅子、薬確認を表示する。

Acceptance:

- [ ] 車両ごとにRideStopが送迎順で表示される
- [ ] 予定時刻、備考、車椅子、薬確認が見える
- [ ] キャンセル操作ができる

Verification:

- [ ] `npm run test -- --run`
- [ ] 手動確認

Dependencies:

- Task 7

Files likely touched:

- `src/components/route-plan.tsx`
- `src/components/ride-stop-row.tsx`
- `src/lib/ride/actions.ts`

Estimated scope:

- M

### Checkpoint 3: 管理者デモ確認

- [ ] 管理者が当日の計画を説明できる
- [ ] AM/PM、車両別、送迎順が確認できる
- [ ] キャンセル操作が反映される

### Phase 4: ドライバー操作

#### Task 9: ドライバー画面を作る

説明:

スマホ幅で使う、次の訪問先中心の運行画面を作る。

Acceptance:

- [ ] 担当車両とAM/PMが表示される
- [ ] 次の訪問先が大きく表示される
- [ ] 住所、電話、備考が表示される
- [ ] 表示がスマホ幅で破綻しない
- [ ] 操作可能な次ボタンが明確に分かる
- [ ] 運転中操作を促す表現がない

Verification:

- [ ] `npm run lint`
- [ ] 375px幅で手動確認

Dependencies:

- Task 8

Files likely touched:

- `src/components/driver-view.tsx`
- `src/components/next-stop-card.tsx`

Estimated scope:

- M

#### Task 10: ドライバー操作イベントを記録する

説明:

到着、乗車/降車、出発、完了、キャンセル、直前取消を画面操作として実装する。

Acceptance:

- [ ] 到着時刻が記録される
- [ ] 乗車/降車時刻が記録される
- [ ] 出発時刻が記録される
- [ ] 完了時刻が記録される
- [ ] 直前操作を1つ取り消せる

Verification:

- [ ] `npm run test -- --run`
- [ ] 手動で1便を完了まで進める

Dependencies:

- Task 9

Files likely touched:

- `src/components/driver-actions.tsx`
- `src/lib/ride/actions.ts`
- `tests/ride/actions.test.ts`

Estimated scope:

- M

### Checkpoint 4: ドライバー操作確認

- [ ] 1人目の送迎を完了まで進められる
- [ ] 不正な順番の操作はできない
- [ ] 操作時刻が残る

### Phase 5: 進捗・実績

#### Task 11: 進捗モニターを作る

説明:

施設職員向けに車両別の現在状態、完了人数、残人数、最終更新を表示する。

Acceptance:

- [ ] 車両ごとの現在ステータスが分かる
- [ ] 完了人数と残人数が分かる
- [ ] 最終更新時刻が分かる
- [ ] 遅延候補が強調される

Verification:

- [ ] `npm run lint`
- [ ] 手動確認

Dependencies:

- Task 10

Files likely touched:

- `src/components/progress-monitor.tsx`
- `src/lib/ride/summary.ts`

Estimated scope:

- M

#### Task 12: 実績画面とCSV出力を作る

説明:

予定時刻と実績時刻を比較し、CSVとして出力できるようにする。

Acceptance:

- [ ] 利用者ごとに予定、到着、出発、完了が見える
- [ ] キャンセル理由が見える
- [ ] 車両別、AM/PM別に絞り込める
- [ ] CSVを出力できる

Verification:

- [ ] `npm run test -- --run`
- [ ] 手動でCSVを出力して内容を確認する

Dependencies:

- Task 10

Files likely touched:

- `src/components/results-table.tsx`
- `src/lib/ride/export-csv.ts`
- `tests/ride/export-csv.test.ts`

Estimated scope:

- M

#### Task 12.5: 送迎表Excel出力を作る

説明:

アプリ内の送迎計画から、紙配布・外部提出用の送迎表Excelを出力できるようにする。

Acceptance:

- [ ] 車両別、AM/PM別の送迎表をExcel出力できる
- [ ] 利用者、予定時刻、住所、電話、備考が出力される
- [ ] 個人情報マスク状態を出力に反映できる
- [ ] 実Excelを入力元にしない

Verification:

- [ ] `npm run test -- --run`
- [ ] 手動でExcelを出力して内容を確認する

Dependencies:

- Task 12

Files likely touched:

- `src/lib/ride/export-excel.ts`
- `src/components/results-table.tsx`
- `tests/ride/export-excel.test.ts`

Estimated scope:

- M

### Checkpoint 5: 送迎後デモ確認

- [ ] 施設職員が進捗を確認できる
- [ ] 管理者が実績を確認できる
- [ ] 送迎表Excelと実績CSVが出力できる

### Phase 6: 受入検証

#### Task 13: 手動デモシナリオを整備する

説明:

ユーザーが確認しやすいように、デモ手順をREADMEまたはdocsにまとめる。

Acceptance:

- [ ] 起動手順がある
- [ ] Excel取込手順がある
- [ ] 管理者、ドライバー、施設職員の確認手順がある
- [ ] CSV出力確認手順がある

Verification:

- [ ] 手順通りに操作できる

Dependencies:

- Task 12

Files likely touched:

- `README.md`
- `docs/demo-checklist.md`

Estimated scope:

- S

#### Task 14: 最終検証を行う

説明:

lint、test、build、`docs/test-plan.md` の受入チェックリスト、手動デモを通し、差分確認する。

Acceptance:

- [ ] `npm run lint` が通る
- [ ] `npm run test -- --run` が通る
- [ ] `npm run build` が通る
- [ ] `docs/test-plan.md` の受入チェックリストを確認済み
- [ ] `docs/ux-ui-design.md` のUI実装チェックリストを確認済み
- [ ] 手動デモ手順が通る
- [ ] `git diff` で差分を確認済み

Verification:

- [ ] コマンド出力
- [ ] 手動確認
- [ ] `git diff`

Dependencies:

- Task 13

Files likely touched:

- 変更なし、または軽微な修正のみ

Estimated scope:

- S

## 6. 並列化可能な作業

承認後に複数セッションで進める場合:

並列化しやすい:

- Task 3とデザイン部品の検討
- Task 11とTask 12。ただしTask 10のイベント形式が確定してから
- READMEと手動デモ手順の作成

順番を守る必要がある:

- Task 1 -> Task 3 -> Task 5
- Task 5 -> Task 6 -> Task 7
- Task 8 -> Task 9 -> Task 10
- Task 10 -> Task 11/12

## 7. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| Excelの結合セルや入力規則で取込が壊れる | 高 | 取込ロジックを分離し、セル位置と見出しの両方で検証する |
| 個人情報を画面やログに出しすぎる | 高 | console出力禁止、マスク表示オプションを入れる |
| 最適化機能まで期待される | 中 | 初回はExcel順を正とし、最適化は将来拡張に固定する |
| スマホ画面が使いづらい | 中 | ドライバー画面は次の訪問先と主要ボタンに絞る |
| DB導入で初回が重くなる | 中 | SQLiteに限定し、必要なら一時的にメモリ状態で逃がせる構造にする |

## 8. 実装開始条件

実装に入るには、ユーザーが以下を承認する必要がある。

- 初回デモは、Excel取込、運行進捗、実績記録の見える化である
- 地図、GPS、通知、AI最適化は初回スコープ外である
- 個人情報は外部APIへ送らない
- ローカルWebアプリとして作る
- 検証はlint、test、build、手動デモで行う

## 9. 承認時の最初の作業

ユーザー承認後、最初に行うこと:

1. `send-demo` をNext.jsプロジェクトとして初期化する
2. lint/test/buildを通す
3. 送迎ドメイン型と状態遷移テストを作る
4. DBモデルとマスタCRUDの最小テストを作る
5. 送迎計画作成の最小テストを作る
6. UX/UI基盤と送迎レーンの最小コンポーネントを作る

ここまでを最初の開発チェックポイントにする。

テスト実装時は `docs/test-plan.md` の優先順位に従う。特にDB保存、マスタCRUD、送迎計画作成、状態遷移、Excel/CSV出力、個人情報保護は初期からテスト対象にする。

UI実装時は `docs/ux-ui-design.md` に従う。特にドライバー画面、送迎レーン、個人情報マスク、色に依存しない状態表示、スマホ幅確認は初期から対象にする。
