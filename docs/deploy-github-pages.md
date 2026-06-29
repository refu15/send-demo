# GitHub Pages デプロイ手順

## 前提

GitHub Pages は静的ファイル配信です。通常版の Prisma / SQLite / API Route は GitHub Pages 上では動きません。

このリポジトリでは、GitHub Pages 用に `NEXT_PUBLIC_STATIC_DEMO=true` の静的デモ版を出力します。

静的デモ版の保存先:

- ブラウザの `localStorage`
- 初回表示時は現場シミュレーションデータを自動投入
- 画面上の登録、編集、削除、送迎操作、Excel 出力は動作

## パスワードゲート

GitHub Pages 用ビルドでは `DEMO_PASSWORD` が必須です。

`DEMO_PASSWORD` は GitHub Actions の Secret として登録します。パスワード本体はコードに保存せず、ビルド時に SHA-256 ハッシュへ変換してブラウザ側へ渡します。

注意: GitHub Pages は静的ファイル配信のため、この方式はデモ用の簡易ゲートです。機密データや本番データを扱う場合は Cloudflare Access、Vercel、Render などのサーバー側認証を使ってください。

## ローカルで静的ビルドを確認

```powershell
cd C:\Users\nnkre\send-demo
$env:DEMO_PASSWORD="共有用のパスワード"
npm run build:pages
```

生成物:

```text
out/
```

## GitHub Pages へ上げる

1. `send-demo` を GitHub リポジトリとして push する
2. GitHub のリポジトリ画面で `Settings > Secrets and variables > Actions` を開く
3. `Repository secrets` に `DEMO_PASSWORD` を登録する
4. `Settings > Pages` を開く
5. `Build and deployment` の `Source` を `GitHub Actions` にする
6. `Actions` タブで `Deploy GitHub Pages Demo` を実行する
7. 完了後、Actions の `github-pages` environment に表示される URL を開く

## 送付前チェック

```powershell
npm run test
npm run lint
npm run build
$env:DEMO_PASSWORD="共有用のパスワード"
npm run build:pages
npm audit --audit-level=moderate
```

## 注意

- GitHub Pages 版は公開デモ用です。本番 DB の永続化はありません。
- `.env`、`prisma/dev.db`、生成された `out/` は公開しません。
- 本番運用へつなぐ場合は GitHub Pages ではなく、サーバー実行環境と PostgreSQL を使う構成に切り替えてください。
