# feature/recipe-form 実装プラン（コア）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **このプランの書式:** ドリフト防止のためフル実装コードは貼らない。「ファイル責務・型/シグネチャ（契約）・テストケース・挙動」中心。テストコードは挙動を表すので具体的に。見た目の細かい寸法・色は実機で詰める。

**Goal:** 作成と編集を兼ねる「常時編集できる1枚のレシピフォーム」を作る。粉の量＝バッチサイズで全体スケール、g↔% 双方向、明示保存（変更時のみ保存ボタン＋離脱ガード）。

**Architecture:** 編集状態とg↔%/スケールのロジックは純粋寄りのフック `useRecipeForm` に集約（テスト可能）。画面 `recipe/new` と `recipe/[id]` は同じ `RecipeForm` を使い回す（`recipe/[id]` が閲覧も編集も兼ね、読み取り専用詳細を置換）。計算は既存 `lib/bakers/calculate.ts` を拡張。データの真実は g（% は表示用に都度計算）。

**Tech Stack:** Expo Router 6（Stack ヘッダー右ボタン・`beforeRemove` 離脱ガード）, React Native 0.81, jest-expo + @testing-library/react-native。

参照: memory `recipe-form-percent-editing`（確定フォームUI 案A・保存モデル）, spec `docs/specs/pan-percent-app-design.md` §4/§5。

---

## スコープ（ブレストで分割済み）
- **含む（コア）:** 統合編集フォーム（名前・粉欄＝量つまみ・その他材料 g↔%・タグ・焼成条件・メモ）、追加/削除、保存モデル（保存ボタン＋離脱時 保存/破棄/キャンセル）、レシピ削除、FAB→新規・カード→編集の配線、読み取り専用詳細（BakerPercentTable/ScaleControl）の置換・撤去。
- **含まない（次ブランチ）:** 写真、材料プリセット、単位（g以外）。

## 確定フォームUI（案A）
画面（上から）: ①レシピ名 → ②粉の欄（強調パネル）: `[−] 量 [＋]`（上・主役）→ 区切り → 粉の名前行（1つ以上）→ 点線「＋粉を足す」 → ③その他の材料: 名前・g・% 行（g↔%連動）・各行「×」削除・下に「＋材料を足す」 → ④タグ → ⑤焼成条件（温度/時間）→ ⑥メモ → ⑦削除（編集時のみ・一番下に小さく＋確認）。

## File Structure
- `lib/i18n/translations.ts`（変更）— フォーム文言キー追加
- `lib/bakers/calculate.ts`（変更）— `gramsFromPercent` 追加（`scaleToFlour` は既存を流用）
- `lib/recipes/useRecipeForm.ts`（新）— 編集状態＋g↔%/スケール/追加削除/dirty を管理するフック（中核）
- `lib/recipes/useRecipeForm.test.tsx`（新）
- `components/recipe/form/IngredientRow.tsx`（新）— その他材料の1行（名前・g・%・×）
- `components/recipe/form/FlourPanel.tsx`（新）— 粉の欄（ステッパー・粉行・粉追加）
- `components/recipe/RecipeForm.tsx`（新）— フォーム全体を組み立て、保存/削除/離脱ガードを担当
- `app/recipe/new.tsx`（新）— 新規作成（空の RecipeForm）
- `app/recipe/[id].tsx`（変更）— 読み取り専用 → 統合フォームに置換
- `app/(tabs)/index.tsx`（変更）— FAB を開発スタブ → `/recipe/new` へ
- 撤去: `components/recipe/BakerPercentTable.tsx(.test)`, `components/recipe/ScaleControl.tsx(.test)`（フォームに統合され不要化）

各テストはソース併置。ただし**画面（app/配下）のテストは top-level `__tests__/` に置く**（Expo Router が app/ 配下を全部バンドルするため。CLAUDE.md 参照）。

---

## Task 1: フォーム文言の i18n キー追加

**Files:** Modify `lib/i18n/translations.ts`、Test `lib/i18n/translate.test.ts`（追記）

追加キー（en/ja/ko すべて。`as const` 辞書なのでキー集合一致必須）:

| key | en | ja | ko |
|---|---|---|---|
| `recipeName` | Recipe name | レシピ名 | 레시피 이름 |
| `flour` | Flour | 粉 | 가루 |
| `targetAmount` | Amount to make | 作りたい量 | 만들 양 |
| `addFlour` | Add flour | 粉を足す | 가루 추가 |
| `addIngredient` | Add ingredient | 材料を足す | 재료 추가 |
| `tags` | Tags | タグ | 태그 |
| `bake` | Baking | 焼成 | 굽기 |
| `temperatureC` | Temp (°C) | 温度 (°C) | 온도 (°C) |
| `minutes` | Time (min) | 時間 (分) | 시간 (분) |
| `save` | Save | 保存 | 저장 |
| `discard` | Discard | 破棄 | 버리기 |
| `unsavedTitle` | Save changes? | 変更を保存しますか？ | 변경을 저장할까요? |
| `newRecipe` | New recipe | 新しいレシピ | 새 레시피 |

- [ ] **Step 1:** `translate.test.ts` に1ケース追記（`translate("ja","targetAmount")==="作りたい量"`, `translate("ko","save")==="저장"`, `translate("en","addFlour")==="Add flour"`）。
- [ ] **Step 2:** `npm test -- translate` → FAIL。
- [ ] **Step 3:** 上表を3言語へ追加。
- [ ] **Step 4:** `npm test -- translate` PASS、`npx tsc --noEmit && npm run lint`。
- [ ] **Step 5:** Commit `feat: add i18n keys for the recipe form`（body 英語・footer なし）。

---

## Task 2: 計算に %→g を追加（TDD）

**Files:** Modify `lib/bakers/calculate.ts`、Test `lib/bakers/calculate.test.ts`（追記）

**契約:** `gramsFromPercent(percent: number, totalFlour: number): number | null`
**挙動:** `percent/100 * totalFlour`。`totalFlour<=0` または `percent` が有限でない場合は `null`（計算不能）。（スケール＝全材料一律倍率は既存 `scaleToFlour(ingredients, targetFlour)` を流用するので新規不要。）

- [ ] **Step 1: 失敗テスト追記**
  - `gramsFromPercent(70, 500)` → `350`
  - `gramsFromPercent(2, 500)` → `10`
  - `gramsFromPercent(70, 0)` → `null`（粉0）
  - `gramsFromPercent(Number.NaN, 500)` → `null`
- [ ] **Step 2:** `npm test -- calculate` → FAIL。
- [ ] **Step 3:** 実装（`if (!(totalFlour>0) || !Number.isFinite(percent)) return null; return (percent/100)*totalFlour;`）。
- [ ] **Step 4:** PASS、`tsc`/`lint`。
- [ ] **Step 5:** Commit `feat: add gramsFromPercent to baker calculation`。

---

## Task 3: useRecipeForm フック（中核・TDD）

**Files:** Create `lib/recipes/useRecipeForm.ts`, `lib/recipes/useRecipeForm.test.tsx`

データの真実は **g**（% は都度計算）。フォーム編集状態と操作をまとめる。

**契約（返り値）:**
```ts
type RecipeFormApi = {
  draft: RecipeDraft;            // { name, ingredients[], tags, bake?, memo?, id? }
  dirty: boolean;                // 初期値から変化したか
  totalFlour: number;            // 粉(isFlour)の合計g
  setName(name: string): void;
  // 粉
  addFlour(): void;              // isFlour=true の空行追加
  setFlourGrams(id: string, grams: number): void;   // 個別の粉g（ブレンド比が変わる）
  scaleTotalFlour(targetGrams: number): void;        // 粉合計→全材料を一律スケール（比率維持）
  // その他材料
  addIngredient(): void;         // isFlour=false の空行追加
  removeIngredient(id: string): void;
  setIngredientName(id: string, name: string): void;
  setIngredientGrams(id: string, grams: number): void;
  setIngredientPercent(id: string, percent: number): void; // g=gramsFromPercent(percent,totalFlour)。粉0なら無視
  // メタ
  setTags(tags: string[]): void;
  setBake(bake: { temperatureC?: number; minutes?: number } | undefined): void;
  setMemo(memo: string): void;
};
function useRecipeForm(initial: Recipe | null): RecipeFormApi
```
**挙動メモ:** `initial===null` は新規（空 draft: name="", ingredients=[1つの空の粉行], tags=[]）。id 生成・保存はしない（保存は画面側で repository.save(draft)）。新しい行の id は `expo-crypto` の randomUUID（テストではモック）。

- [ ] **Step 1: 失敗テスト**（renderHook）主要ケース:
  - 初期 dirty=false。`setName("食パン")` 後 dirty=true。
  - 粉500g・水(isFlour=false)未設定で `setIngredientPercent(waterId, 70)` → water.grams===350。
  - `scaleTotalFlour(1000)`（元粉500/水350）→ 粉1000・水700（比率維持）。
  - `addIngredient()` で行が1増え、`removeIngredient(id)` で減る。
  - `setIngredientGrams` で g 変更が反映。
  - 粉0のとき `setIngredientPercent` は g を変えない（落ちない）。
  テスト方針: `expo-crypto` の randomUUID をモック。`@react-navigation/native` は使わないなら不要。`bakerPercents` 等での % 確認は計算関数側に任せ、ここでは g と dirty を検証。
- [ ] **Step 2:** `npm test -- useRecipeForm` → FAIL。
- [ ] **Step 3:** 実装（`useState<RecipeDraft>`、各操作で ingredients を更新。`scaleTotalFlour` は `scaleToFlour` を使う。`setIngredientPercent` は `gramsFromPercent`。dirty は初期 draft と現在の比較 or 変更フラグ）。
- [ ] **Step 4:** PASS、`tsc`/`lint`。
- [ ] **Step 5:** Commit `feat: add useRecipeForm state hook`。

---

## Task 4: IngredientRow コンポーネント（TDD・RNTL）

**Files:** Create `components/recipe/form/IngredientRow.tsx`、Test 併置

**契約:** `IngredientRow({ ingredient, percent, onName, onGrams, onPercent, onRemove })`
- `ingredient: Ingredient`、`percent: number | null`（表示用、粉0なら "—"）。
- コールバック: 名前/ g / % 入力変更、× で削除。
**挙動:** 名前・g・% を input（数値は keyboardType="numeric"）、右に小さな「×」(accessibilityLabel=delete)。色/サイズは `useTheme` トークン。

- [ ] **Step 1: 失敗テスト** — ケース:
  - 名前 input に値が出る／変更で `onName` が呼ばれる。
  - g を変えると `onGrams` が数値で呼ばれる。
  - % を変えると `onPercent` が呼ばれる。
  - 「×」押下で `onRemove` が呼ばれる（testID か accessibilityLabel）。
  - `LanguageProvider` でラップ、`expo-localization` を en でモック。
- [ ] **Step 2:** FAIL。
- [ ] **Step 3:** 実装。
- [ ] **Step 4:** PASS、`tsc`/`lint`。
- [ ] **Step 5:** Commit `feat: add IngredientRow form component`。

---

## Task 5: FlourPanel コンポーネント（TDD・RNTL）

**Files:** Create `components/recipe/form/FlourPanel.tsx`、Test 併置

**契約:** `FlourPanel({ flours, totalFlour, onScaleTotal, onFlourGrams, onFlourName, onAddFlour })`
- `flours: Ingredient[]`（isFlour=true のみ）。
**挙動（案A）:** 上に `[−] 合計g [＋]` ステッパー（押すと `onScaleTotal(newTotal)`、増減幅は実装時に決める。例: 10g 刻み or 5%）→ 区切り → 粉の名前行（複数なら各 g＋粉内%）→ 点線ブロック「＋粉を足す」(`onAddFlour`)。粉1つでも複数でも同じ骨格。文言は `useT`（`flour`/`targetAmount`/`addFlour`）。

- [ ] **Step 1: 失敗テスト** — ケース:
  - 合計 250 が表示される。`＋` 押下で `onScaleTotal` が現在より大きい値で呼ばれる、`−` で小さい値。
  - 粉が2つなら名前が2行出る。
  - 「＋粉を足す」押下で `onAddFlour` が呼ばれる。
- [ ] **Step 2:** FAIL。
- [ ] **Step 3:** 実装。
- [ ] **Step 4:** PASS、`tsc`/`lint`。
- [ ] **Step 5:** Commit `feat: add FlourPanel form component`。

---

## Task 6: RecipeForm（組み立て・TDD・RNTL）

**Files:** Create `components/recipe/RecipeForm.tsx`、Test は top-level `__tests__/recipe-form.test.tsx`（画面に近く expo-router/navigation を使うため app 外で）

**契約:** `RecipeForm({ initial }: { initial: Recipe | null })`
**責務:** `useRecipeForm(initial)` を使い、UI を組む: レシピ名 input → `FlourPanel` → その他材料（`IngredientRow` のリスト＋「＋材料を足す」）→ タグ入力 → 焼成条件（温度/時間 input）→ メモ input → （`initial!==null` のとき）一番下に小さな削除ボタン（確認ダイアログ→`repository.remove`→`router.back()`）。
**保存/離脱:** `useNavigation().setOptions({ headerRight })` で **dirty のとき保存ボタンを表示**（押すと `repository.save(draft)` → 保存後 dirty 解除 → `router.back()` または詳細表示）。`navigation.addListener("beforeRemove", e)` で **dirty かつ未保存の戻る操作を捕捉** → `Alert`（保存/破棄/キャンセル）。破棄=そのまま戻る、保存=save して戻る、キャンセル=留まる。無変更なら何もせず戻れる。

- [ ] **Step 1: 失敗テスト**（`__tests__/recipe-form.test.tsx`）— `LanguageProvider` でラップ、`expo-router`（useRouter/useNavigation）・`@react-navigation/native`・`expo-localization`・`expo-crypto`・AsyncStorage をモック。ケース:
  - `initial=null` で空フォームが出る（レシピ名 input・粉欄・「＋材料を足す」）。
  - 既存 `initial` を渡すと名前・材料が入って表示される。
  - 名前を変更すると保存ボタン（headerRight）が出る（setOptions が dirty で呼ばれることを検証 or 保存ボタンの testID 出現）。
  - 保存押下で `repository.save` が draft 相当で呼ばれ `router.back()`。
  - 既存編集時、削除→確認→`repository.remove`→`router.back()`。
- [ ] **Step 2:** FAIL。
- [ ] **Step 3:** 実装（保存/離脱の navigation 連携含む）。
- [ ] **Step 4:** PASS、`tsc`/`lint`、`npm test` 全体。
- [ ] **Step 5:** Commit `feat: add unified RecipeForm with explicit save`。

---

## Task 7: 画面に配線（new / [id] / FAB）

**Files:**
- Create `app/recipe/new.tsx`
- Modify `app/recipe/[id].tsx`（読み取り専用 → `RecipeForm` に置換）
- Modify `app/(tabs)/index.tsx`（FAB を `/recipe/new` へ）
- Test: 既存 `__tests__/recipes-screen.test.tsx` を FAB 挙動変更に合わせて更新。`__tests__/recipe-detail-screen.test.tsx` を編集フォーム前提に更新。

**`new.tsx`:** `export default () => <RecipeForm initial={null} />`。
**`[id].tsx`:** `useLocalSearchParams` の id → `useRecipe(id)`（既存）→ `<RecipeForm initial={recipe} />`（loading 中/見つからない時の簡易表示は維持）。
**`(tabs)/index.tsx`:** FAB の `onPress` を開発スタブ（サンプル追加）→ `router.push("/recipe/new")` に変更。サンプル追加コードと HACK コメントを削除。

- [ ] **Step 1: テスト更新（失敗確認）**
  - `__tests__/recipes-screen.test.tsx`: 「FAB を押すと `/recipe/new` に push される」（useRouter.push のモックで検証）に変更。旧「サンプル追加で card 出現」テストは置換。
  - `__tests__/recipe-detail-screen.test.tsx`: 既存レシピを渡すとフォーム（名前 input 等）が出る、に更新。
- [ ] **Step 2:** 該当テスト FAIL。
- [ ] **Step 3:** 実装（new.tsx 作成、[id].tsx 置換、FAB 変更）。typed routes のため `/recipe/new` ルートが必要 → new.tsx 作成で型が増える（必要なら `npx expo start` で `.expo/types` 再生成してから `tsc`）。
- [ ] **Step 4:** `npm test` 全体 PASS、`tsc`/`lint`。
- [ ] **Step 5: 手動（任意）:** `npx expo start` → FAB→新規作成→保存→一覧、カード→編集→保存/破棄。
- [ ] **Step 6:** Commit `feat: wire create/edit form into routes and FAB`。

---

## Task 8: 旧 読み取り専用コンポーネントの撤去

**Files:** Delete `components/recipe/BakerPercentTable.tsx`(+test), `components/recipe/ScaleControl.tsx`(+test)

統合フォームが役割を引き継いだので撤去（`recipe/[id].tsx` はもう参照しない）。`lib/bakers/calculate.ts` の純粋関数（`bakerPercents`/`scaleToFlour`/`gramsFromPercent`）は引き続き使用＝残す。

- [ ] **Step 1:** 参照が無いことを確認（`grep -rn "BakerPercentTable\|ScaleControl" app components`）。
- [ ] **Step 2:** `git rm` で2コンポーネント＋テストを削除。
- [ ] **Step 3:** `npm test` 全体 PASS、`tsc`/`lint` クリーン。
- [ ] **Step 4:** Commit `chore: remove read-only baker table and scale control`。

---

## 完了条件
- `npm run lint`・`npx tsc --noEmit`・`npm test` 全て成功。
- 新規作成（FAB→`/recipe/new`）と編集（カード→`/recipe/[id]`）が同じフォームで動く。
- 粉の量つまみで全体スケール、その他材料は g↔% 連動、材料の追加/削除ができる。
- 変更時だけ保存ボタン、未保存で戻ると「保存/破棄/キャンセル」、無変更なら普通に戻れる。
- 既存編集時に削除（確認付き）ができる。
- 読み取り専用の BakerPercentTable/ScaleControl が撤去されている。

このブランチ完了後、`feature/recipe-photo`（写真）/ `feature/ingredient-presets`（プリセット）/ 単位、へ進む。

---

## Self-Review メモ
- memory `recipe-form-percent-editing`（案A・保存モデル・g↔%・ブレンド）→ Task3〜7 ✅
- spec §4 双方向計算 → Task2(%→g)＋Task3 ✅ / §5 作成・編集・削除 → Task6/7 ✅
- 写真・プリセット・単位 → 本ブランチ非対象（次） ✅
- 画面テストは `__tests__/`（app 外）に配置（Expo Router 制約）✅
- 全タスクに lint/tsc/test を含む ✅
