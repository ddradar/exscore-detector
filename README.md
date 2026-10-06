# exscore-detector

通常スコアから判定内訳と EX スコア候補を推定する静的サイトです。

## 使い方

1. ノート数, フリーズアロー(FA)数, ショックアロー(SA)数を入力
2. 通常スコアを入力
3. `計算する` を押下

フルコンボ種別は常に未指定で推定します。

## JSONインポート機能について

直接入力する代わりに、譜面情報のまとまりをJSON ファイルに記録し、それをインポートして利用することができます。  
一度取り込んだJSONファイルはブラウザの記憶領域(localStorage)に保持されるため、ブラウザを再起動しても、再度インポートする必要はありません。

1. JSONファイルを用意する
2. JSON ファイルを画面の「JSONファイルをここにドラッグ＆ドロップ」にドラッグ＆ドロップするか、「ファイル選択」からファイルを選択する
3. 曲名のプルダウンから該当する曲を選択する
4. 通常スコアを入力
5. `計算する` を押下して結果を確認する

### JSONの形式（スキーマ）

- 実際のJSONには、コメント(`//` 以降の部分)を含めないでください。
- サンプルは[こちら](./test/songs.json)にあります。
- (詳しい方向け): JSON のスキーマは `public/songs.schema.json` にあります。

```json
{
  "name": "鉄心道 Act.3", // 譜面のまとまりを表す名前（イベント名など）
  "charts": [
    {
      "name": "ビビットストリーム", // 曲名 (必須。ドロップダウンに表示される項目)
      "difficulty": "EXPERT", // 難易度 (必須。BEGINNER, BASIC, DIFFICULT, EXPERT, CHALLENGE)
      "level": 13, // レベル (必須。1-20)
      "notes": 464, // 通常ノート数 (必須)
      "freezes": 18, // フリーズアロー数 (任意。省略時は0)
      "shocks": 0 // ショックアロー数 (任意。省略時は0)
    },
    {
      "name": "紅焔",
      "difficulty": "EXPERT",
      "level": 12,
      "notes": 420,
      "freezes": 19
    }
    // 以下省略
  ]
}
```

## 開発

### ファイル構成

- `index.html`: 画面本体
- `src/main.css`: スタイル
- `src/core/score.ts`: EX スコア推定のコアロジック
- `src/core/imported-song-data.ts`: 楽曲データ検証/保持ロジック
- `src/ui/app-ui.ts`: UI ロジック
- `src/main.ts`: エントリーポイント
- `public/songs.schema.json`: インポート JSON のスキーマ

- Node.js 24 (+ npm 11)が必要です。

```bash
# 依存関係のインストール
npm install
# コードの整形チェック
npm run lint
# コードの整形チェック（修正できる場合は自動修正）
npm run lint -- --fix
# 開発サーバー起動
npm run dev
# ビルド
npm run build
# テスト
npm test
```
