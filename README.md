# 読みがな付与ツール

Yahoo! JAPAN日本語形態素解析APIを使用して、日本語テキストに読みがな（ルビ）を自動付与するWebアプリケーションです。

![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC)

## 機能

### 🎯 主要機能
- **読みがな自動付与**: 漢字に読みがな（ルビ）を自動で付与
- **送り仮名分離**: `蘇って【よみがえって】` → `蘇【よみがえ】って`
- **出力形式選択**: XHTML方式とかっこ方式の選択可能
  - XHTML方式: `<ruby><rb>漢字</rb><rt>かんじ</rt></ruby>`
  - 墨つき括弧方式: `漢字【かんじ】`

### ⚙️ カスタマイズ機能
- **常用漢字フィルタ**: 常用漢字のみの単語を除外
- **スキップ機能**: 指定範囲内で同じ単語の重複処理を回避
- **大容量対応**: 最大100万文字のテキスト処理
- **インテリジェントな分割**: 4KB制限を考慮した適切な文分割

### 📊 ユーザビリティ
- **リアルタイム進捗**: 処理状況をリアルタイムで表示
- **エラーハンドリング**: 詳細なエラー表示とステータス管理
- **レスポンシブUI**: モバイル・デスクトップ対応

## セットアップ

### 前提条件
- Node.js 18以上
- Yahoo! Developer NetworkのClient ID（Application ID）

### インストール

1. リポジトリをクローン
```bash
git clone https://github.com/analekt/yahoo-morpheme-rubi.git
cd yahoo-morpheme-rubi
```

2. 依存関係をインストール
```bash
npm install
```

3. 開発サーバーを起動
```bash
npm run dev
```

4. ブラウザで [http://localhost:3000](http://localhost:3000) を開く

### 本番ビルド
```bash
npm run build
npm start
```

## 使用方法

### 1. Client IDの取得
[Yahoo! Developer Network](https://developer.yahoo.co.jp/)でアカウントを作成し、Application IDを取得してください。

### 2. 基本的な使い方
1. **Client ID入力**: 取得したClient IDを入力
2. **設定調整**: 
   - スキップ範囲: 重複回避の文字数範囲
   - 常用漢字フィルタ: ON/OFFの選択
   - 出力形式: XHTML方式または墨つき括弧方式
3. **テキスト入力**: 処理したいテキストを入力
4. **実行**: 「読みがなを付与」ボタンをクリック

### 3. 出力例
**入力**: `美しい水車小屋の娘`
**出力（XHTML）**: `<ruby><rb>美</rb><rt>うつく</rt></ruby>しい<ruby><rb>水車小屋</rb><rt>すいしゃごや</rt></ruby>の<ruby><rb>娘</rb><rt>むすめ</rt></ruby>`
**出力（括弧）**: `美【うつく】しい水車小屋【すいしゃごや】の娘【むすめ】`

## 技術仕様

### アーキテクチャ
- **フロントエンド**: Next.js 15 + TypeScript + Tailwind CSS
- **API**: Yahoo! JAPAN日本語形態素解析 Web API V2
- **デプロイ**: Vercel対応

### APIの制限
- **最大リクエストサイズ**: 4KB
- **レート制限**: Yahoo! APIの規約に準拠
- **対応形式**: JSON-RPC 2.0

### パフォーマンス最適化
- **チャンク分割**: 4KB制限に対応した適切な文分割
- **非同期処理**: 大容量テキストの段階的処理
- **レート制限対策**: リクエスト間隔の自動調整

## ファイル構成

```
src/
├── app/
│   ├── page.tsx              # メインUI
│   └── api/morpheme/
│       └── route.ts          # Yahoo API プロキシ
└── lib/
    └── utils.ts              # ユーティリティ関数
```

## 送り仮名分離アルゴリズム

### 処理フロー
1. **表層形解析**: 末尾からひらがなを特定
2. **読み分離**: 送り仮名部分を読みから除去
3. **適切な出力**: 漢字部分のみにルビを付与

### 実装例
```typescript
// 「動いて」「うごいて」の場合
separateOkurigana("動いて", "うごいて")
// 返値: { kanjiPart: "動", kanjiReading: "うご", okurigana: "いて" }
```

## 常用漢字フィルタ

2010年改定の常用漢字表に基づく2,136文字の完全なセットを使用。常用漢字のみで構成される単語を除外できます。

## Vercelでのデプロイ

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/analekt/yahoo-morpheme-rubi)

1. Vercelアカウントにログイン
2. GitHubリポジトリを連携
3. 自動デプロイされます

## ライセンス

MIT License

## 貢献

Issue、Pull Requestはいつでも歓迎です。

## 開発者

Yahoo! JAPAN形態素解析APIを活用した読みがな付与ツールです。教育、出版、アクセシビリティ向上など、様々な用途でご活用ください。

---

**注意**: このツールを使用するには、Yahoo! Developer NetworkでのClient ID取得が必要です。APIの利用規約をご確認の上、適切にご利用ください。