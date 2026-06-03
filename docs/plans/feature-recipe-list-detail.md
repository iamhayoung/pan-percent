# feature/recipe-list-detail 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **このプランの書式:** ドリフト防止のため、実装本体のフルコードは貼らず「ファイル責務・型/シグネチャ（契約）・テストケース・挙動」中心で書く。テストコードは挙動を表すので具体的に書く。UI の見た目は design system 準拠の機能する v1（磨き込みは実機反復で後）。

**Goal:** レシピ一覧・詳細・スケール表示の読み取り UI を Expo Router で構築する（作成 form は次ブランチ、依存箇所はスタブ）。

**Architecture:** `app/` の画面は薄く、データは自前フック `useRecipes`/`useRecipe`（`recipeRepository` ＋ `useFocusEffect` 再読込）経由。計算は既存 `lib/bakers/calculate` の純粋関数を利用。色・余白は `useTheme()` トークン、文言は `useT()`。

**Tech Stack:** Expo Router 6（Tabs/Stack）, React Native 0.81, `@expo/vector-icons`（filled）, jest-expo + @testing-library/react-native。

参照 spec: `docs/specs/pan-percent-app-design.md`（§5 画面, §6 デザイン, §3 構成）

---

## スコープ（ブレストで確定）

- **含む:** (tabs)（レシピ/設定）+ recipe/[id]、RecipeCard / BakerPercentTable / ScaleControl、useRecipes / useRecipe、一覧の空状態、詳細の削除（確認ダイアログ）
- **スタブ:** 設定タブ＝プレースホルダ、一覧 FAB＝開発用「サンプル1件追加」、詳細の編集ボタン＝無効/非表示
- **defer:** Liquid Glass（標準タブバー）、タグ絞り込みチップ

---

## File Structure

- `lib/i18n/translations.ts`（変更）— 画面文言キーを en/ja/ko に追加
- `lib/recipes/useRecipes.ts`（新）— 一覧取得フック
- `lib/recipes/useRecipe.ts`（新）— 単一取得フック
- `components/recipe/BakerPercentTable.tsx`（新）— ベーカー比表示
- `components/recipe/ScaleControl.tsx`（新）— 粉総量入力→スケール表示
- `components/recipe/RecipeCard.tsx`（新）— 一覧カード
- `app/(tabs)/_layout.tsx`（新）— Tabs ナビゲーター
- `app/(tabs)/index.tsx`（新）— レシピ一覧（移行先）
- `app/(tabs)/settings.tsx`（新）— 設定スタブ
- `app/recipe/[id].tsx`（新）— 詳細＋スケール
- `app/_layout.tsx`（変更）— Stack に (tabs) と recipe/[id]
- `app/index.tsx`（削除）— (tabs)/index.tsx へ移行

各テストはソースに併置。

---

## Task 1: 画面文言の i18n キー追加

**Files:** Modify `lib/i18n/translations.ts`、Test `lib/i18n/translate.test.ts`（既存に追記）

既存辞書（`appName` / `tabRecipes` / `tabSettings`）に以下キーを **en/ja/ko の3言語すべて**へ追加する。`as const` 辞書なので3言語でキー集合が一致していること（不一致はコンパイルエラー）。

追加キーと文言:

| key | en | ja | ko |
|---|---|---|---|
| `recipesEmpty` | No recipes yet | レシピがありません | 레시피가 없습니다 |
| `addSampleRecipe` | Add sample recipe | サンプルを追加 | 샘플 추가 |
| `bakerPercent` | Baker's % | ベーカー% | 베이커 % |
| `ingredients` | Ingredients | 材料 | 재료 |
| `memo` | Memo | メモ | 메모 |
| `scaleTitle` | Scale | スケール | 스케일 |
| `targetFlourGrams` | Target flour (g) | 粉の総量 (g) | 가루 총량 (g) |
| `scaleUnavailable` | Add flour to scale | 粉を入れると計算できます | 가루를 넣으면 계산됩니다 |
| `edit` | Edit | 編集 | 편집 |
| `delete` | Delete | 削除 | 삭제 |
| `deleteConfirmTitle` | Delete this recipe? | このレシピを削除しますか？ | 이 레시피를 삭제할까요? |
| `cancel` | Cancel | キャンセル | 취소 |

- [ ] **Step 1: 失敗テストを追記**（`lib/i18n/translate.test.ts` に1ケース）

```ts
it("has the recipe screen keys in every language", () => {
  expect(translate("ja", "recipesEmpty")).toBe("レシピがありません");
  expect(translate("ko", "delete")).toBe("삭제");
  expect(translate("en", "targetFlourGrams")).toBe("Target flour (g)");
});
```

- [ ] **Step 2:** `npm test -- translate` → FAIL（キー未定義の型/値エラー）
- [ ] **Step 3:** `translations.ts` に上表のキーを3言語へ追加
- [ ] **Step 4:** `npm test -- translate` → PASS、`npx tsc --noEmit && npm run lint`
- [ ] **Step 5: Commit**
  - title: `feat: add i18n keys for recipe screens`
  - body: 一覧/詳細/スケール画面の文言キーを en/ja/ko に追加した旨（2-3 行・英語・footer なし）

---

## Task 2: データ取得フック（useRecipes / useRecipe・TDD）

**Files:** Create `lib/recipes/useRecipes.ts`, `lib/recipes/useRecipe.ts`、Test `lib/recipes/useRecipes.test.tsx`, `lib/recipes/useRecipe.test.tsx`

**契約:**
```ts
function useRecipes(): { recipes: Recipe[]; loading: boolean; reload: () => Promise<void> }
function useRecipe(id: string): { recipe: Recipe | null; loading: boolean; reload: () => Promise<void> }
```
**挙動:** マウント時に `recipeRepository.list()` / `.get(id)` を読み込む。`useFocusEffect`（`@react-navigation/native`）で画面フォーカス時に再読込（mutation 後の反映）。`reload` は手動再取得用。

**テスト方針:** `@react-navigation/native` の `useFocusEffect` を「コールバックを即時1回呼ぶ」モックにし、AsyncStorage モック（Task 1 of recipe-storage で導入済み）に repository 経由でデータを入れてから、`@testing-library/react-native` の `renderHook` で検証する。`expo-crypto` は `randomUUID` をモック。

- [ ] **Step 1: 失敗テスト**（useRecipes.test.tsx）— 主要ケース:
  - 何も保存されていなければ `recipes === []`（loading が false に落ちる）
  - repository に2件 save 後にフックを使うと `recipes` に2件入る
  - `reload()` で再取得できる
  useRecipe.test.tsx —
  - 存在する id で `recipe` が取れる / 存在しない id で `null`

  テスト骨子（useRecipes）:
  ```tsx
  import { renderHook, waitFor } from "@testing-library/react-native";
  jest.mock("@react-navigation/native", () => ({
    useFocusEffect: (cb: () => void) => cb(),
  }));
  jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "uuid-x") }));
  // beforeEach: await AsyncStorage.clear()
  it("loads recipes from the repository", async () => {
    await save(draft("A"));
    const { result } = renderHook(() => useRecipes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.recipes).toHaveLength(1);
  });
  ```

- [ ] **Step 2:** `npm test -- useRecipe` → FAIL（モジュール未存在）
- [ ] **Step 3: 実装**（契約通り。`useState` + 非同期 read、`useFocusEffect` で reload を呼ぶ。`useCallback` で reload を安定化）
- [ ] **Step 4:** `npm test -- useRecipe` → PASS、`npx tsc --noEmit && npm run lint`
- [ ] **Step 5: Commit** — `feat: add useRecipes and useRecipe hooks`（body 英語・footer なし）

---

## Task 3: BakerPercentTable コンポーネント（TDD・RNTL）

**Files:** Create `components/recipe/BakerPercentTable.tsx`、Test `components/recipe/BakerPercentTable.test.tsx`

**契約:** `function BakerPercentTable({ ingredients }: { ingredients: Ingredient[] }): JSX.Element`
**挙動:** 各材料を1行で表示（材料名・g・ベーカー%）。% は `bakerPercents(ingredients)`（既存 `@/lib/bakers/calculate`）で算出し、`percent === null` の行は `—` を表示（粉が無い時）。色/余白は `useTheme()` トークン、文言は `useT()`（ヘッダに `ingredients`/`bakerPercent`）。

- [ ] **Step 1: 失敗テスト** — ケース:
  - 粉500g/水350g を渡すと、行に `100%` と `70%`（または `100` `70`）が表示される（`screen.getByText` で確認）
  - 粉が無い（isFlour 全 false）と、各行に `—` が表示される
  - render は `LanguageProvider` でラップ（`expo-localization` は en でモック）
- [ ] **Step 2:** `npm test -- BakerPercentTable` → FAIL
- [ ] **Step 3: 実装**（材料配列を map して行を描画。% 表示は `null`→`"—"`、数値は整数 or 小数1桁に丸めて表示。丸め方は実装時に決め、テストの期待値と一致させる）
- [ ] **Step 4:** PASS、`tsc`/`lint`
- [ ] **Step 5: Commit** — `feat: add BakerPercentTable component`

---

## Task 4: ScaleControl コンポーネント（TDD・RNTL）

**Files:** Create `components/recipe/ScaleControl.tsx`、Test `components/recipe/ScaleControl.test.tsx`

**契約:** `function ScaleControl({ ingredients }: { ingredients: Ingredient[] }): JSX.Element`
**挙動:** 粉総量（目標 g）を数値入力（`TextInput` keyboardType="numeric"、初期値は現在の `totalFlour(ingredients)`）。入力に応じて `scaleToFlour(ingredients, target)` で各材料の再計算 g を一覧表示（保存はしない一時計算）。`scaleToFlour` が `null`（粉0 or 不正値）のときは `scaleUnavailable` 文言を表示し、入力を無効化。文言は `useT()`（`scaleTitle`/`targetFlourGrams`）。

- [ ] **Step 1: 失敗テスト** — ケース:
  - 粉500/水350、目標 `1000` を入力 → 水 `700`（g）が表示される（`fireEvent.changeText`）
  - 粉が無い → `scaleUnavailable` 文言が出て入力が無効（編集できない／表示が `—`）
  - 不正入力（空・`0`）でクラッシュしない（`—` or 無効表示）
- [ ] **Step 2:** FAIL
- [ ] **Step 3: 実装**（`useState` で target 文字列を保持、`Number()` 変換、`scaleToFlour` 呼び出し。`null` 時の表示分岐）
- [ ] **Step 4:** PASS、`tsc`/`lint`
- [ ] **Step 5: Commit** — `feat: add ScaleControl component`

---

## Task 5: RecipeCard コンポーネント（TDD・RNTL）

**Files:** Create `components/recipe/RecipeCard.tsx`、Test `components/recipe/RecipeCard.test.tsx`

**契約:** `function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }): JSX.Element`
**挙動:** カード（角丸12px・surface 色）に写真サムネ（`photoUri` あれば `expo-image`、無ければプレースホルダ面）・名前・タグを表示。タップで `onPress`。`Pressable`/`TouchableOpacity` を使い、アクセシブルに名前を読めること。

- [ ] **Step 1: 失敗テスト** — ケース:
  - `recipe.name` が表示される
  - タップで `onPress` が呼ばれる（`fireEvent.press`）
  - タグがあれば表示される
- [ ] **Step 2:** FAIL
- [ ] **Step 3: 実装**（`useTheme` トークンで surface/border/角丸。写真なし時はプレースホルダ View）
- [ ] **Step 4:** PASS、`tsc`/`lint`
- [ ] **Step 5: Commit** — `feat: add RecipeCard component`

---

## Task 6: タブナビゲーションと一覧画面

**Files:**
- Create `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/settings.tsx`
- Modify `app/_layout.tsx`
- Delete `app/index.tsx`
- Test `app/(tabs)/index.test.tsx`

**`(tabs)/_layout.tsx`:** `Tabs`（expo-router）で2タブ。`recipes`（index）と `settings`。タイトル/タブラベルは `useT()`（`tabRecipes`/`tabSettings`）、アイコンは `@expo/vector-icons` の filled（例: Ionicons `book`/`settings`）。

**`(tabs)/settings.tsx`:** スタブ。中央に `tabSettings` のテキストのみ（中身は settings-i18n ブランチ）。

**`(tabs)/index.tsx`（一覧）:** `useRecipes()` を使用。`recipes` を `FlatList` で `RecipeCard` 描画、タップで `router.push(\`/recipe/\${id}\`)`（`useRouter`）。0件時は `recipesEmpty` の空状態を中央表示。右下に FAB。
- **FAB は当面開発スタブ:** タップで `recipeRepository.save()` によりサンプルレシピ（粉500g/水350g/塩10g 等の固定 draft）を1件追加し、`reload()`。`// HACK: temporary dev seed — replace with router.push("/recipe/new") in feature/recipe-form` のコメントを付ける。横幅に応じ1〜2カラム（`FlatList` の `numColumns` を画面幅で算出、または1カラム固定で可、実装時に判断）。

**`app/_layout.tsx`（変更）:** `LanguageProvider` 配下の `Stack` に `(tabs)` と `recipe/[id]` が載るようにする（`Stack` の screen 構成。headerShown は画面ごとに調整）。

**`app/index.tsx` 削除**（一覧は (tabs)/index.tsx へ移行）。

- [ ] **Step 1: 失敗テスト**（`app/(tabs)/index.test.tsx`）— 一覧画面の default export を、`LanguageProvider` でラップしてレンダリング。`expo-router`（`useRouter`）と `@react-navigation/native`（`useFocusEffect`）をモック、AsyncStorage モックを利用。ケース:
  - 何も無いと `recipesEmpty` 文言が表示される
  - repository に1件 save 済みなら、その名前が表示される
  - FAB を押すと（`recipesEmpty` から）1件追加され名前が出る（dev スタブの確認）
- [ ] **Step 2:** FAIL
- [ ] **Step 3: 実装**（上記の責務通り。まず一覧画面とタブ、_layout、index 削除）
- [ ] **Step 4:** `npm test`（全体）、`npx tsc --noEmit && npm run lint`、`npm test -- "(tabs)"` 個別も PASS
- [ ] **Step 5: 手動確認（任意）:** `npx expo start` で起動 → 2タブ表示、FAB でサンプル追加→カード表示→タップで詳細遷移（詳細は Task 7 後）
- [ ] **Step 6: Commit** — `feat: add tab navigation and recipe list screen`（body に dev-stub FAB の旨を明記）

---

## Task 7: レシピ詳細画面（スケール込み）

**Files:** Create `app/recipe/[id].tsx`、Test `app/recipe/[id].test.tsx`

**`recipe/[id].tsx`:** `useLocalSearchParams<{ id: string }>()` で id 取得 → `useRecipe(id)`。表示: 写真・名前・タグ・焼成条件（`bake`）・メモ・`BakerPercentTable`・`ScaleControl`。操作: 削除（`Alert.alert` で確認 → `recipeRepository.remove(id)` → `router.back()`）。編集ボタンは form 未実装のため**無効/非表示**（`// HACK: edit enabled in feature/recipe-form`）。`recipe === null`（loading 後も無い）の場合は簡素な not-found 表示。

- [ ] **Step 1: 失敗テスト**（`app/recipe/[id].test.tsx`）— `LanguageProvider` でラップ、`expo-router`（`useLocalSearchParams`→固定 id、`useRouter`）と `@react-navigation/native`（`useFocusEffect`）をモック、AsyncStorage に1件 save。ケース:
  - 保存済みレシピの名前と、BakerPercentTable の比率（`100`/`70` 等）が表示される
  - `delete` を押すと確認後 `recipeRepository.remove` が呼ばれ `router.back()` される（`Alert.alert` をモックして確認ボタンのコールバックを発火）
  - 存在しない id では not-found 表示
- [ ] **Step 2:** FAIL
- [ ] **Step 3: 実装**（上記責務通り。`Alert.alert` で確認ダイアログ。削除後 `router.back()`）
- [ ] **Step 4:** `npm test`（全体 PASS）、`npx tsc --noEmit && npm run lint`
- [ ] **Step 5: 手動確認（任意）:** `npx expo start` → FAB でサンプル追加 → カードタップ → 詳細・ベーカー比・スケール（目標 g 変更で再計算）・削除（確認→一覧へ）
- [ ] **Step 6: Commit** — `feat: add recipe detail screen with scaling`

---

## 完了条件

- `npm run lint`・`npx tsc --noEmit`・`npm test` がすべて成功
- 2タブ（レシピ/設定スタブ）が表示され、一覧が空状態とカード表示を持つ
- FAB（開発スタブ）でサンプルを追加でき、カード→詳細へ遷移
- 詳細でベーカー比・スケール（一時計算）・削除（確認ダイアログ）が動作
- 文言が en/ja/ko で表示され、色が light/dark トークンに追従
- 実機確認: `feature/recipe-storage` で保留した AsyncStorage 永続化・`expo-crypto` UUID を、本ブランチの FAB→一覧→再起動で実機検証する（spec の「実機反復」観点）

このブランチ完了後、`feature/recipe-form`（作成/編集・写真・タグ・焼成条件、FAB と編集ボタンを本実装に差し替え）へ進む。

---

## Self-Review メモ

- spec §5 一覧/詳細/作成（作成は次ブランチ）→ 一覧=Task6 / 詳細=Task7 ✅、作成は defer（FAB スタブ）
- spec §5 スケール（比率→重量・一時計算）→ Task4 ScaleControl ✅
- spec §5 設定タブ → Task6 スタブ ✅（中身は settings-i18n）
- spec §6 design system（角丸12/filled/トークン）→ 各コンポーネントで `useTheme` 使用 ✅
- spec §9 i18n → Task1 文言キー ✅
- Liquid Glass（spec §8）・タグ絞り込み（spec §5）→ 本ブランチ defer（後続）
- 全タスクに `npm run lint` を含む（recipe-storage の Task1 lint 漏れの反省を反映）
