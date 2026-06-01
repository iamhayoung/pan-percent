# Pan Percent — 設計ドキュメント

- 日付: 2026-06-02
- ステータス: 承認待ち（ブレインストーミング完了）
- 対象: ベーカーズパーセント計算 + 製パンレシピ保存アプリ

## 1. 概要

製パンレシピを保存し、ベーカーズパーセント（baker's percentage）を計算するクロスプラットフォーム・モバイルアプリ。Expo (React Native) + TypeScript で構築する。

- 参考: https://en.wikipedia.org/wiki/Baker_percentage
- サービス名（ロケール別表示）:
  - en: **Pan Percent**
  - ja: **ぱんパーセント**（「ぱん」はひらがな）
  - ko: **빵 퍼센트**
  - ※ `app.json` の内部識別子（slug/scheme 等）は `pan-percent` のまま据え置き

### 設計原則（プロジェクト CLAUDE.md 準拠）
- 宣言的プログラミング / 型安全優先 / 副作用最小化
- 既存値から導出できる値は新規 state を作らない、props を増やしすぎない
- 「本質だけ残す極度の単純さ」「予測可能性 > 賢さ」
- any / type assertion / ts-ignore / lint ignore 禁止
- TDD（Testing Trophy 準拠）

## 2. スコープ

### 対象（v1）
- レシピの作成・閲覧・編集・削除（端末ローカル保存、DB無し）
- ベーカーズパーセントの計算（双方向）
  - 重量 → 比率（作成/編集時のライブ表示）
  - 比率 → 重量（詳細でのスケール計算）
- レシピ項目: 名前 / 材料リスト / メモ / 写真 / タグ / 焼成条件
- 多言語対応（en / ja / ko、端末追従 + 手動切替）
- ライト / ダークモード対応（端末追従）
- iOS 26+ で Liquid Glass 対応（フォールバックあり）

### 非対象（将来拡張）
- クラウド同期 / アカウント / バックエンド
- 加水率（hydration）の自動表示（液体材料の区別フラグが必要）
- 単体電卓（保存しない計算）— 計算はレシピに統合する
- 手動のダークモード切替 UI（v1 は端末追従のみ。実機検証後に必要なら追加）

## 3. アーキテクチャ / フォルダ構成

```
app/                          # 画面（Expo Router・typed routes）
  _layout.tsx                 # ルートStack + i18n/テーマ/データ初期化
  (tabs)/
    _layout.tsx               # 2タブ: レシピ / 設定
    index.tsx                 # レシピ一覧（ホーム）
    settings.tsx              # 設定（言語切替）
  recipe/
    new.tsx                   # レシピ新規作成
    [id].tsx                  # レシピ詳細（閲覧＋スケール計算）
    edit/[id].tsx             # レシピ編集
  +not-found.tsx

components/
  recipe/
    RecipeCard.tsx            # 一覧の1枚
    RecipeForm.tsx            # 作成/編集の共通フォーム
    IngredientRow.tsx         # 材料1行（名前・g・粉フラグ）
    BakerPercentTable.tsx     # ベーカー比の表示
    ScaleControl.tsx          # 粉総量を変えてスケール
  ui/                         # 汎用UI（Button等、必要分のみ）

lib/
  recipes/recipeRepository.ts # AsyncStorage CRUD（リポジトリ層）
  bakers/calculate.ts         # 純粋関数：比率計算・スケール
  i18n/                       # 辞書・言語フック
  theme/                      # 色・タイポ・余白トークン

types/recipe.ts               # 型定義
```

### 方針
- 画面（`app/`）は薄く、ロジックは `lib/` に寄せる（宣言的・テスタブル）
- UI はリポジトリ層越しにのみデータアクセス（直接 AsyncStorage を触らない）
- 計算は副作用ゼロの純粋関数に分離
- 既存の `app-example/`（雛形）と `app/index.tsx` の中身は置き換え/削除

## 4. データモデルと計算ロジック

### 型定義（`types/recipe.ts`）
```ts
type Ingredient = {
  id: string;
  name: string;
  grams: number;
  isFlour: boolean;   // 「粉の総量=100%」の基準に含めるか
};

type Recipe = {
  id: string;
  name: string;
  ingredients: Ingredient[];
  memo?: string;
  photoUri?: string;          // 端末内にコピーした画像のURI
  tags: string[];
  bake?: { temperatureC?: number; minutes?: number };
  createdAt: number;          // epoch ms
  updatedAt: number;
};
```

### 計算（`lib/bakers/calculate.ts`、純粋関数）
ベーカーズパーセントの定義: 全ての粉の合計を 100% とし、各材料を粉に対する比率で表す。

```
totalFlour   = Σ grams (isFlour=true)
totalWeight  = Σ grams (全材料)
percentOf(i) = grams_i / totalFlour * 100        // 各材料のベーカー比

// スケール（粉総量 → 各材料の重量を逆算）
factor       = targetFlour / totalFlour
scaledGrams  = grams_i * factor                  // 比率は不変、重量だけ変わる
```

- 作成/編集: 材料と g を入れる → ベーカー比をライブ表示（重量→比率）
- 詳細: 粉総量を変える → 全材料の重量を再計算（比率→重量、保存はしない一時計算）

### エッジケース
- 粉が 0g（isFlour 材料なし / 合計0）→ 比率は計算不能。表示は「—」、スケールは無効化（クラッシュさせない）
- 空のレシピ / 材料0件 → 一覧・詳細とも空状態 UI
- g 入力は数値のみ（負数・非数を弾く）

## 5. 画面と操作フロー

> 画面・操作フロー・配色は実機で触りながら反復前提。以下は v1 の出発点。

- **レシピ一覧** (`(tabs)/index.tsx`): RecipeCard の縦リスト（写真サムネ＋名前＋タグ）、右下に追加ボタン、タグ絞り込みチップ、0件時は空状態。カードタップで詳細へ。横幅に応じ1〜2カラム可変。
- **レシピ詳細** (`recipe/[id].tsx`): 写真・名前・タグ・焼成条件・メモ、BakerPercentTable、ScaleControl、編集・削除（確認ダイアログ）。
- **作成/編集** (`recipe/new.tsx`, `recipe/edit/[id].tsx`): 共通 RecipeForm。材料行の追加/削除、写真選択、タグ、焼成条件、メモ。入力中に BakerPercentTable をライブ更新。保存でリポジトリ永続化 → 一覧へ。
- **設定** (`(tabs)/settings.tsx`): 言語切替（端末追従 / en / ja / ko）、アプリ情報。

### ナビゲーション
- ルート Stack の中に `(tabs)`（レシピ/設定の2タブ）
- `recipe/*` は Stack スクリーンとして push 遷移
- typed routes で型安全

## 6. デザインシステム

> v1 のたたき台。実機で反復し、WCAG AA 以上を両モードで実機検証する。

### 禁止事項（プロジェクト指定）の順守
- indigo/violet/purple 等クールカラー不使用
- カード角丸は 12px（大面で選択的に 20px）。8px 禁止
- アイコンは filled（outline 不使用）
- グラデーション・過度な効果の排除（OS純正の Liquid Glass を除く）
- 最低限の色数（ニュートラル＋アクセント1色）
- 落書き（手描き）風イラストを空状態などに最小限
- レイアウトは本質だけ残す単純さ

### カラー（ライト、初期値）
| 役割 | 色 | 用途 |
|---|---|---|
| Background | `#FBF7F0` | 画面背景 |
| Surface | `#FFFFFF` | カード面 |
| Text primary | `#2B2420` | 本文（背景比 約12:1, AAA） |
| Text secondary | `#6B5E54` | 補助（背景比 約4.7:1, AA） |
| Accent | `#C0612F` | ボタン・選択・強調（白文字比 約4.6:1, AA） |
| Border | `#E7DECF` | 区切り線 |

- ダークモード用パレットも同構成で別途定義（両モード AA 以上を実機検証）

### トークン
- 余白: 4 の倍数スケール（4/8/12/16/24/32）
- 角丸: 12px 基準
- フォント: OS 標準（iOS=SF / Android=Roboto、日本語・韓国語グリフは OS 標準でカバー）

## 7. テーマ / カラースキーム（ダークモード）
- light / dark の2パレットをトークンで定義
- `useColorScheme()` で端末のダーク設定に追従（v1 は自動追従）
- 両モードとも WCAG AA 以上を保証

## 8. iOS Liquid Glass（iOS 26+）
- 機構: `expo-glass-effect`（`GlassView` / `isLiquidGlassAvailable()`）、ネイティブタブバーのガラス表現
- 適用範囲: ナビゲーション面（タブバー・ヘッダー）とフローティング要素（追加ボタン等）に限定。コンテンツ面はフラット維持
- フォールバック: iOS 26 未満 / Android はフラットなソリッド面（`isLiquidGlassAvailable()` で実行時分岐）

## 9. 多言語対応（i18n）
- `expo-localization` で端末言語検出 → en/ja/ko 以外は en にフォールバック
- `as const` 型付き辞書（キー・言語とも型補完、typo はコンパイルエラー）
- アプリ名も辞書管理
- 言語状態は React Context（`useT()` フックで参照）。手動切替は AsyncStorage に保存し次回起動も維持

## 10. 永続化・写真（リポジトリ層）
- `recipeRepository.ts`: `list / get / save / remove` を AsyncStorage（JSON）で実装。UI はこの層のみ参照
- ID は UUID 生成（`expo-crypto`）
- 写真: `expo-image-picker` で選択 → `expo-file-system` でアプリ領域にコピーし URI を保存（base64 は持たない）。削除時は画像も後始末
- 言語などの設定値も同層に薄く同居

## 11. テスト / 依存 / 対応OS

### テスト（TDD・Testing Trophy）
- 純粋関数（calc）: 単体テスト中心
- リポジトリ: AsyncStorage モックで結合テスト
- 主要コンポーネント: React Native Testing Library
- 基盤: `jest-expo` + `@testing-library/react-native`
- テストが正しいことを確認してからコミット → 実装でパスさせる

### 依存
- 追加（最小限）: `@react-native-async-storage/async-storage`, `expo-localization`, `expo-image-picker`, `expo-file-system`, `expo-crypto`, `expo-glass-effect`
- 棚卸し: 未使用パッケージを削除し、バージョンは `expo install` で Expo 54 互換の最新へ更新（互換を壊すメジャー更新はしない）
- Lint/Format: 既存の Biome（各段階で `npm run lint`）

### 対応OS（目安、Expo 54 サポート範囲内で調整）
- iOS: 現行サポート最古機種が動く版 ≒ iOS 16 系目安
- Android: Pixel/Galaxy のアップデート対象最古 ≒ Android 11/12 目安
- フォルダブル/各画面サイズ配慮: safe-area 全対応、固定px幅を避け Flex + 最大幅コンテナ、横幅に応じ1〜2カラム可変

## 12. ブランチ戦略
develop から作業スコープ単位で feature ブランチを切り、各々レビュー → develop へマージ。stage/main はリリース時に develop→stage→main で運用。

1. `feature/foundation` — 雛形整理・未使用依存削除/更新・テーマ（light/dark）・i18n 土台・テスト基盤・CLAUDE.md 更新・本 spec
2. `feature/recipe-storage` — 型・計算純粋関数・リポジトリ層（テスト付き）
3. `feature/recipe-list-detail` — 一覧・詳細・スケール表示
4. `feature/recipe-form` — 作成/編集・写真・タグ・焼成条件
5. `feature/settings-i18n` — 設定画面・言語切替・ダークモード仕上げ
6. Liquid Glass はナビ実装段階（list-detail / settings）で組み込み、iOS 26+ で検証

## 13. リリースバージョン管理 / タグ
- **Semantic Versioning（semver）** で `app.json` の `version`（例 `1.0.0`）をユーザー向けバージョンとして管理
- リリース（stage→main マージ）時に main へ `vX.Y.Z` の git tag を打つ
- ネイティブのビルド番号: iOS `buildNumber` / Android `versionCode` をリリースごとに増分
- コミット規約は既存踏襲（Conventional Commits 風: `feat:` / `fix:` / `chore:` / `docs:` …）。将来の CHANGELOG 自動生成にも繋げやすい形にする
- v1 初期リリースは `1.0.0`（tag `v1.0.0`）

## 14. CLAUDE.md の更新
現行 CLAUDE.md には未実装ルート（`(tabs)/`, `recipe/register.tsx` 等）など実態と乖離した記述がある。本設計の実態（ルート構成・データ層・i18n・テーマ・ブランチ戦略・対応OS・UI/UX ガイドライン）に合わせてメインで書き換える（`feature/foundation` 内）。
