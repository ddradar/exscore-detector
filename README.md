# exscore-detector

通常スコアから判定内訳と EX スコア候補を推定する静的サイトです。

## ファイル構成

- `index.html`: 画面本体
- `styles.css`: スタイル
- `app.js`: UI ロジックと推定呼び出し
- `songs.json`: `title`（曲名+難易度）、ノート数、フリーズ/ショック数データ

## 使い方

1. `title`（曲名+難易度）を選択
2. 通常スコアを入力
3. `計算する` を押下

フルコンボ種別は常に未指定で推定します。

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
