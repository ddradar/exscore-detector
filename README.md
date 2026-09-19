# exscore-detector

通常スコアから判定内訳と EX スコア候補を推定する静的サイトです。

## 使い方

1. `title`（曲名+難易度）を選択
2. 通常スコアを入力
3. `計算する` を押下

フルコンボ種別は常に未指定で推定します。

## ファイル構成

- `index.html`: 画面本体
- `styles.css`: スタイル
- `src/core/exscore.js`: EX スコア推定のコアロジック
- `src/core/song-data.js`: 楽曲データ検証ロジック
- `src/ui/app-ui.js`: UI ロジック
- `src/main.js`: エントリーポイント
- `public/songs.json`: `title`（曲名+難易度）、ノート数、フリーズ/ショック数データ

## songs.json 形式

各要素は 1 譜面を表します。`title` は `曲名 (難易度)` 形式です。

`OK数` は `freezes + shocks` として計算に渡します。

```json
[
  {
    "title": "Song Name (EXPERT)",
    "notes": 900,
    "freezes": 12,
    "shocks": 0
  }
]
```

## 開発

- Node.js 24 (+ npm 11)が必要です。

```bash
# 依存関係のインストール
npm install
# 開発サーバー起動
npm run dev
# ビルド
npm run build
# テスト
npm test
```
