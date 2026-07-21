# feature/ingredient-autocomplete 実装プラン

> ⚠️ **棚上げ (SHELVED · 2026-07-22)** — autocomplete は実機で動かず棚上げした。RN で「スクロールするコンテンツの"上に"UI を浮かせる」難所を解消できず、**overlay / Modal ボトムシート / inline チップ / キーボード上バー を全て試して fail**。材料名は素の TextInput に戻し、**このプランのうち `yield` フィールドのみ採用**した。
>
> 失敗理由と再挑戦方針はメモリー `autocomplete-rn-trials.md` に記録。実装コードは git 履歴に保存（`buildSuggestions` の かな↔カナ正規化などは再挑戦時に流用可）。再挑戦は自前実装せず成熟ライブラリ（`@gorhom/bottom-sheet` / `react-native-keyboard-controller`）＋**実機スパイク先行**で。以下のプラン本文は当時の記録として残す。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **このプランの書式:** ドリフト防止のためフル実装コードは貼らない。「ファイル責務・型/シグネチャ（契約）・テストケース・挙動」中心。テストコードは挙動を表すので具体的に。見た目の細かい寸法・色は実機で詰める。

**Goal:** 編集画面の材料名入力にフォーカス時、過去レシピから自動構築した辞書（粉用 / 材料用、別）を overlay で候補表示する autocomplete を入れる。あわせて Recipe に optional な「分量」フィールド (`yield`) を追加し、リストプレビューの先頭にも表示して同名レシピを区別しやすくする。

**Architecture:** ロジックは pure 関数 `buildSuggestions` に集約（テスト容易）、データソースは `recipeRepository.list()` で取得し `useFocusEffect` で画面 focus 時にリロードするカスタムフック `useIngredientSuggestions` で配信。UI は `NameAutocomplete` コンポーネント（TextInput + absolute position overlay）として独立、`FlourPanel` と `IngredientRow` がこれをラップする。`yield` フィールドは `RecipeDraft` に optional 追加、`useRecipeForm` の `setYield` action で更新。

**Tech Stack:** React Native 0.81 + Expo SDK 54、`@react-navigation/native` の `useFocusEffect`、jest-expo + @testing-library/react-native。

参照: `docs/specs/2026-06-08-ingredient-autocomplete-and-yield.md`

---

## File Structure

**新規:**
- `lib/recipes/ingredientSuggestions.ts` — pure 関数 `buildSuggestions(recipes, isFlour, query)`
- `lib/recipes/ingredientSuggestions.test.ts`
- `lib/recipes/useIngredientSuggestions.ts` — recipes を `useFocusEffect` で load し、`forFlour` / `forOther` を返すフック
- `lib/recipes/useIngredientSuggestions.test.tsx`
- `components/recipe/form/NameAutocomplete.tsx` — TextInput + overlay 候補リスト
- `components/recipe/form/NameAutocomplete.test.tsx`

**変更:**
- `types/recipe.ts` — `Recipe.yield?: string` 追加
- `lib/i18n/translations.ts` — `yield`（ラベル）, `yieldPlaceholder`（en/ja/ko）追加
- `lib/recipes/listPreview.ts` — `yield` があれば先頭に prepend
- `lib/recipes/listPreview.test.ts` — yield 込みケース追加
- `lib/recipes/useRecipeForm.ts` — `setYield` action 追加
- `lib/recipes/useRecipeForm.test.tsx` — `setYield` テスト追加
- `components/recipe/form/FlourPanel.tsx` — name TextInput を NameAutocomplete に差し替え、`suggest` prop を受ける
- `components/recipe/form/FlourPanel.test.tsx` — `suggest` prop を `noop` で渡す
- `components/recipe/form/IngredientRow.tsx` — 同上
- `components/recipe/form/IngredientRow.test.tsx` — 同上
- `components/recipe/RecipeForm.tsx` — `useIngredientSuggestions` 統合、yield TextInput をタグ下に追加
- `__tests__/recipe-form.test.tsx` — 必要に応じて、テスト中に `useFocusEffect` のモックが既存通り効くか確認、yield 入力可能テスト追加

各テストはソース併置。RecipeForm の screen test は既存通り `__tests__/` 配下。

---

## Task 1: Recipe 型に `yield` を追加

**Files:**
- Modify: `types/recipe.ts`

**契約:**
```ts
export type Recipe = {
  ...既存
  yield?: string;
  ...既存
};
```
`RecipeDraft = Omit<Recipe, "id" | "createdAt" | "updatedAt"> & { id?: string }` の定義はそのまま、`yield` は自動継承。

- [ ] **Step 1: 型修正**

Edit `types/recipe.ts`: `memo?: string;` の隣に `yield?: string;` を追加。コメント不要（spec で説明済み）。

- [ ] **Step 2: tsc 確認**

```bash
nvm use 22 && npx tsc --noEmit
```
期待: clean。

- [ ] **Step 3: コミット**

```bash
git add types/recipe.ts
git commit -m "feat: add optional yield to Recipe type"
```

---

## Task 2: i18n に `yieldPlaceholder` を追加

**Files:**
- Modify: `lib/i18n/translations.ts`

**契約:** 既存 `as const` 辞書（en/ja/ko）に **キー集合一致** で追加。

| key | en | ja | ko |
|---|---|---|---|
| `yieldPlaceholder` | `1 loaf pan, 8 pieces` | `1斤型1つ分、8個分` | `식빵틀 1개 분량, 8개분` |

> `yield` は JS の予約語と紛らわしいので i18n キーは `yieldPlaceholder` にする（property 名と分離）。「分量」自体のラベル文字列は今 UI に出さない（placeholder で代替）ので追加しない。

- [ ] **Step 1: 3 言語に追加**

各ブロックに `yieldPlaceholder` を追加。

- [ ] **Step 2: 既存 i18n テストを走らせて pass 確認**

```bash
npx jest lib/i18n
```

- [ ] **Step 3: コミット**

```bash
git add lib/i18n/translations.ts
git commit -m "feat: add yield label and placeholder to translations"
```

---

## Task 3: `useRecipeForm` に `setYield` を追加

**Files:**
- Modify: `lib/recipes/useRecipeForm.ts`
- Modify: `lib/recipes/useRecipeForm.test.tsx`

**契約:**
```ts
type RecipeFormApi = {
  ...既存
  setYield: (yieldText: string) => void;
};
```
- `setYield(text)` → `setDraft(d => ({ ...d, yield: text }))`
- 空文字も保存する（trim は呼び出し側 / 表示側で）
- `isValid` には影響しない（optional）

- [ ] **Step 1: テスト追加（failing）**

`useRecipeForm.test.tsx` に：

```tsx
it("sets and clears yield text", () => {
  const { result } = renderHook(() => useRecipeForm(null));
  expect(result.current.draft.yield).toBeUndefined();

  act(() => result.current.setYield("1斤型1つ分"));
  expect(result.current.draft.yield).toBe("1斤型1つ分");

  act(() => result.current.setYield(""));
  expect(result.current.draft.yield).toBe("");
});
```

`npx jest lib/recipes/useRecipeForm.test.tsx` で fail を確認。

- [ ] **Step 2: 実装**

`useRecipeForm.ts` の `RecipeFormApi` 型に `setYield` 追加、return オブジェクトに `setYield: (yieldText) => setDraft((d) => ({ ...d, yield: yieldText }))` を追加（既存 `setMemo` の隣）。

- [ ] **Step 3: テスト pass 確認**

```bash
npx jest lib/recipes/useRecipeForm.test.tsx
```

- [ ] **Step 4: コミット**

```bash
git add lib/recipes/useRecipeForm.ts lib/recipes/useRecipeForm.test.tsx
git commit -m "feat: add setYield action to useRecipeForm"
```

---

## Task 4: `listPreview` で yield を先頭に追加

**Files:**
- Modify: `lib/recipes/listPreview.ts`
- Modify: `lib/recipes/listPreview.test.ts`

**契約:** `buildListPreview(recipe)` は `recipe.yield?.trim()` が非空なら、`yield` を `parts` の先頭に挿入してから既存材料を続ける。空 / undefined は無視。

- [ ] **Step 1: テスト 2 ケース追加（failing）**

`listPreview.test.ts` に：

```ts
it("prepends yield when present", () => {
  const r = recipe({
    yield: "1斤型1つ分",
    ingredients: [
      { id: "flour", name: "Bread flour", grams: 500, isFlour: true },
      { id: "water", name: "Water", grams: 350, isFlour: false },
    ],
  });
  expect(buildListPreview(r)).toBe(
    "1斤型1つ分 · Bread flour 500g · Water 350g",
  );
});

it("ignores blank yield", () => {
  const r = recipe({
    yield: "   ",
    ingredients: [
      { id: "flour", name: "Bread flour", grams: 500, isFlour: true },
    ],
  });
  expect(buildListPreview(r)).toBe("Bread flour 500g");
});
```

`npx jest lib/recipes/listPreview.test.ts` で fail 確認。

- [ ] **Step 2: 実装**

`listPreview.ts`：

```ts
const yieldText = recipe.yield?.trim();
const yieldPart = yieldText ? [yieldText] : [];
return [...yieldPart, ...flourParts, ...otherParts].join(SEPARATOR);
```

実際は既存 `parts` 配列の先頭に push する形でも可。

- [ ] **Step 3: テスト pass**

```bash
npx jest lib/recipes/listPreview.test.ts
```

- [ ] **Step 4: コミット**

```bash
git add lib/recipes/listPreview.ts lib/recipes/listPreview.test.ts
git commit -m "feat: prepend recipe yield to list preview"
```

---

## Task 5: `buildSuggestions` 純粋関数を作る

**Files:**
- Create: `lib/recipes/ingredientSuggestions.ts`
- Create: `lib/recipes/ingredientSuggestions.test.ts`

**契約:**
```ts
export const MAX_SUGGESTIONS = 5;

export function buildSuggestions(
  recipes: Recipe[],
  isFlour: boolean,
  query: string,
): string[];
```

**挙動:**
1. recipes 全 `ingredients` を flatten。
2. `i.isFlour === isFlour` かつ `i.name.trim() !== ""` だけ通す。
3. trim 後の name を key に `Map<string, number>` で count。
4. `query.trim()` が非空なら、`name.toLowerCase().includes(q.toLowerCase())` フィルタ。
5. count 降順、tie は最初に登場した順（stable sort）。
6. 上位 `MAX_SUGGESTIONS` 件の name を返す。

- [ ] **Step 1: テスト追加（failing、7 ケース）**

`ingredientSuggestions.test.ts`：

```ts
import type { Recipe } from "@/types/recipe";
import { buildSuggestions } from "./ingredientSuggestions";

const recipe = (id: string, ings: Recipe["ingredients"]): Recipe => ({
  id,
  name: id,
  ingredients: ings,
  tags: [],
  createdAt: 1,
  updatedAt: 1,
});

describe("buildSuggestions", () => {
  it("returns empty array when there are no recipes", () => {
    expect(buildSuggestions([], false, "")).toEqual([]);
  });

  it("filters by isFlour", () => {
    const recipes = [
      recipe("r1", [
        { id: "i1", name: "Bread flour", grams: 500, isFlour: true },
        { id: "i2", name: "Water", grams: 350, isFlour: false },
      ]),
    ];
    expect(buildSuggestions(recipes, true, "")).toEqual(["Bread flour"]);
    expect(buildSuggestions(recipes, false, "")).toEqual(["Water"]);
  });

  it("orders by usage count descending", () => {
    const recipes = [
      recipe("r1", [
        { id: "i1", name: "Water", grams: 350, isFlour: false },
        { id: "i2", name: "Salt", grams: 10, isFlour: false },
      ]),
      recipe("r2", [
        { id: "i3", name: "Water", grams: 200, isFlour: false },
        { id: "i4", name: "Sugar", grams: 30, isFlour: false },
      ]),
      recipe("r3", [
        { id: "i5", name: "Water", grams: 300, isFlour: false },
      ]),
    ];
    expect(buildSuggestions(recipes, false, "")).toEqual([
      "Water",
      "Salt",
      "Sugar",
    ]);
  });

  it("ties keep first-seen order", () => {
    const recipes = [
      recipe("r1", [
        { id: "i1", name: "Salt", grams: 10, isFlour: false },
        { id: "i2", name: "Sugar", grams: 30, isFlour: false },
      ]),
    ];
    expect(buildSuggestions(recipes, false, "")).toEqual(["Salt", "Sugar"]);
  });

  it("filters by case-insensitive partial query", () => {
    const recipes = [
      recipe("r1", [
        { id: "i1", name: "Milk", grams: 100, isFlour: false },
        { id: "i2", name: "Water", grams: 350, isFlour: false },
        { id: "i3", name: "Mineral water", grams: 100, isFlour: false },
      ]),
    ];
    expect(buildSuggestions(recipes, false, "mi")).toEqual([
      "Milk",
      "Mineral water",
    ]);
  });

  it("excludes whitespace-only names", () => {
    const recipes = [
      recipe("r1", [
        { id: "i1", name: "   ", grams: 10, isFlour: false },
        { id: "i2", name: "Water", grams: 350, isFlour: false },
      ]),
    ];
    expect(buildSuggestions(recipes, false, "")).toEqual(["Water"]);
  });

  it("caps result at MAX_SUGGESTIONS (5)", () => {
    const ings = ["a", "b", "c", "d", "e", "f", "g"].map((n, idx) => ({
      id: `i${idx}`,
      name: n,
      grams: 1,
      isFlour: false,
    }));
    const recipes = [recipe("r1", ings)];
    expect(buildSuggestions(recipes, false, "")).toHaveLength(5);
  });
});
```

`npx jest lib/recipes/ingredientSuggestions.test.ts` で fail 確認。

- [ ] **Step 2: 実装**

`ingredientSuggestions.ts`：

```ts
import type { Recipe } from "@/types/recipe";

export const MAX_SUGGESTIONS = 5;

export function buildSuggestions(
  recipes: Recipe[],
  isFlour: boolean,
  query: string,
): string[] {
  const counts = new Map<string, number>();
  const firstSeen = new Map<string, number>();
  let order = 0;

  for (const r of recipes) {
    for (const i of r.ingredients) {
      if (i.isFlour !== isFlour) continue;
      const name = i.name.trim();
      if (name === "") continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
      if (!firstSeen.has(name)) firstSeen.set(name, order++);
    }
  }

  const q = query.trim().toLowerCase();
  const entries = Array.from(counts.entries()).filter(([name]) =>
    q === "" ? true : name.toLowerCase().includes(q),
  );

  entries.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return (firstSeen.get(a[0]) ?? 0) - (firstSeen.get(b[0]) ?? 0);
  });

  return entries.slice(0, MAX_SUGGESTIONS).map(([name]) => name);
}
```

- [ ] **Step 3: テスト pass**

```bash
npx jest lib/recipes/ingredientSuggestions.test.ts
```

- [ ] **Step 4: コミット**

```bash
git add lib/recipes/ingredientSuggestions.ts lib/recipes/ingredientSuggestions.test.ts
git commit -m "feat: add buildSuggestions to rank ingredient names by usage"
```

---

## Task 6: `useIngredientSuggestions` フックを作る

**Files:**
- Create: `lib/recipes/useIngredientSuggestions.ts`
- Create: `lib/recipes/useIngredientSuggestions.test.tsx`

**契約:**
```ts
export function useIngredientSuggestions(): {
  forFlour: (query: string) => string[];
  forOther: (query: string) => string[];
};
```

**挙動:**
- 内部に `const [recipes, setRecipes] = useState<Recipe[]>([])`。
- `useFocusEffect(useCallback(() => { void reload(); }, [reload]))` で画面 focus 時に `recipeRepository.list()` 呼び出し、結果を state に反映。
- `forFlour` / `forOther` は `useCallback`、`buildSuggestions(recipes, true/false, query)` を呼ぶ。deps は `[recipes]`。

- [ ] **Step 1: テスト追加（failing）**

`useIngredientSuggestions.test.tsx`：

```tsx
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useIngredientSuggestions } from "./useIngredientSuggestions";
import { save } from "./recipeRepository";

jest.mock("@react-navigation/native", () => {
  const react = require("react");
  return {
    useFocusEffect: (cb: () => void) => react.useEffect(() => cb(), [cb]),
  };
});

describe("useIngredientSuggestions", () => {
  beforeEach(async () => {
    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default;
    await AsyncStorage.clear();
  });

  it("returns empty arrays initially", () => {
    const { result } = renderHook(() => useIngredientSuggestions());
    expect(result.current.forFlour("")).toEqual([]);
    expect(result.current.forOther("")).toEqual([]);
  });

  it("loads recipes on focus and splits flour vs other suggestions", async () => {
    await save({
      name: "r1",
      ingredients: [
        { id: "i1", name: "Bread flour", grams: 500, isFlour: true },
        { id: "i2", name: "Water", grams: 350, isFlour: false },
      ],
      tags: [],
    });

    const { result } = renderHook(() => useIngredientSuggestions());

    await waitFor(() => {
      expect(result.current.forFlour("")).toEqual(["Bread flour"]);
    });
    expect(result.current.forOther("")).toEqual(["Water"]);
  });
});
```

`npx jest lib/recipes/useIngredientSuggestions.test.tsx` で fail 確認。

- [ ] **Step 2: 実装**

`useIngredientSuggestions.ts`：

```ts
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import type { Recipe } from "@/types/recipe";
import { buildSuggestions } from "./ingredientSuggestions";
import { list } from "./recipeRepository";

export function useIngredientSuggestions(): {
  forFlour: (query: string) => string[];
  forOther: (query: string) => string[];
} {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const reload = useCallback(async () => {
    setRecipes(await list());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const forFlour = useCallback(
    (query: string) => buildSuggestions(recipes, true, query),
    [recipes],
  );
  const forOther = useCallback(
    (query: string) => buildSuggestions(recipes, false, query),
    [recipes],
  );

  return { forFlour, forOther };
}
```

- [ ] **Step 3: テスト pass**

```bash
npx jest lib/recipes/useIngredientSuggestions.test.tsx
```

- [ ] **Step 4: コミット**

```bash
git add lib/recipes/useIngredientSuggestions.ts lib/recipes/useIngredientSuggestions.test.tsx
git commit -m "feat: add useIngredientSuggestions hook backed by stored recipes"
```

---

## Task 7: `NameAutocomplete` コンポーネントを作る

**Files:**
- Create: `components/recipe/form/NameAutocomplete.tsx`
- Create: `components/recipe/form/NameAutocomplete.test.tsx`

**契約:**
```ts
type Props = {
  testID: string;
  value: string;
  onChangeText: (next: string) => void;
  suggest: (query: string) => string[];
  placeholder?: string;
  placeholderTextColor?: string;
  style?: StyleProp<TextStyle>;
};
```

**挙動:**
- 内部 state: `focused: boolean`。
- `onFocus` → `focused = true`。
- `onBlur` → `setTimeout(() => setFocused(false), 0)`（候補タップとの race を回避）。
- candidates = `suggest(value)`。
- overlay は `focused && candidates.length > 0` のときだけ render。
- overlay は `position: "absolute"`, `top: "100%"`, `left: 0`, `right: 0`, `zIndex: 10`、背景 `theme.colors.surface`、border `theme.colors.border`、角丸 12、影 / elevation 軽め。
- 候補は `Pressable`、`testID={`name-autocomplete-suggestion-${index}`}`、押下で `onChangeText(name)` + `Keyboard.dismiss()` + setFocused(false)。
- ルート要素は `View` で `position: "relative"`、TextInput と overlay を子に。

**注意:** 親 (`IngredientRow` / `FlourPanel`) の row 要素は overflow が overlay を切らないようにする必要あり。Task 8/9 で row のスタイルに `overflow: "visible"` を入れる。

- [ ] **Step 1: テスト追加（failing、3 ケース）**

`NameAutocomplete.test.tsx`：

```tsx
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { NameAutocomplete } from "./NameAutocomplete";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));

const renderWith = (ui: React.ReactElement) =>
  render(<LanguageProvider>{ui}</LanguageProvider>);

describe("NameAutocomplete", () => {
  it("shows suggestions only when focused and there are candidates", () => {
    const suggest = jest.fn(() => ["Water", "Salt"]);
    renderWith(
      <NameAutocomplete
        testID="name"
        value=""
        onChangeText={() => {}}
        suggest={suggest}
      />,
    );

    // initially blurred
    expect(screen.queryByText("Water")).toBeNull();

    fireEvent(screen.getByTestId("name"), "focus");
    expect(screen.getByText("Water")).toBeTruthy();
    expect(screen.getByText("Salt")).toBeTruthy();
  });

  it("hides overlay when suggest returns empty", () => {
    renderWith(
      <NameAutocomplete
        testID="name"
        value="xyz"
        onChangeText={() => {}}
        suggest={() => []}
      />,
    );
    fireEvent(screen.getByTestId("name"), "focus");
    expect(screen.queryByTestId("name-autocomplete-suggestion-0")).toBeNull();
  });

  it("calls onChangeText with the chosen suggestion and removes overlay", () => {
    const onChangeText = jest.fn();
    renderWith(
      <NameAutocomplete
        testID="name"
        value=""
        onChangeText={onChangeText}
        suggest={() => ["Water", "Salt"]}
      />,
    );
    fireEvent(screen.getByTestId("name"), "focus");
    fireEvent.press(screen.getByTestId("name-autocomplete-suggestion-0"));

    expect(onChangeText).toHaveBeenCalledWith("Water");
    expect(screen.queryByText("Water")).toBeNull();
  });
});
```

`npx jest components/recipe/form/NameAutocomplete.test.tsx` で fail 確認。

- [ ] **Step 2: 実装**

`NameAutocomplete.tsx`：

- ルート `<View style={{ position: "relative" }}>`
- `<TextInput testID={testID} value={value} onChangeText={onChangeText} onFocus={...} onBlur={...} ... />`
- overlay は条件付きで render：
  ```tsx
  {focused && candidates.length > 0 && (
    <View style={[styles.overlay, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {candidates.map((name, i) => (
        <Pressable
          key={name}
          testID={`name-autocomplete-suggestion-${i}`}
          onPress={() => {
            onChangeText(name);
            Keyboard.dismiss();
            setFocused(false);
          }}
        >
          <Text>{name}</Text>
        </Pressable>
      ))}
    </View>
  )}
  ```

スタイル目安：overlay は padding 4 + 各 item padding 10/12、border 1、borderRadius 12、shadow / elevation 軽め、top: "100%", left: 0, right: 0, zIndex: 10。

- [ ] **Step 3: テスト pass**

```bash
npx jest components/recipe/form/NameAutocomplete.test.tsx
```

- [ ] **Step 4: コミット**

```bash
git add components/recipe/form/NameAutocomplete.tsx components/recipe/form/NameAutocomplete.test.tsx
git commit -m "feat: add NameAutocomplete with focus-driven overlay"
```

---

## Task 8: `FlourPanel` の粉名入力を `NameAutocomplete` に差し替え

**Files:**
- Modify: `components/recipe/form/FlourPanel.tsx`
- Modify: `components/recipe/form/FlourPanel.test.tsx`

**契約:**
- Props に `suggest: (query: string) => string[]` を追加（required）。
- 既存 `flour-name-${id}` testID は **`NameAutocomplete` の `testID` として渡す**（互換）。
- 既存テストは `baseProps.suggest = () => []` を入れて維持。
- flour row のスタイルに `overflow: "visible"` を入れる（overlay が切れないように）。

- [ ] **Step 1: 既存テスト更新（pass のまま）**

`FlourPanel.test.tsx` の `baseProps` に `suggest: () => []` を追加。すべての既存ケース pass のまま。

- [ ] **Step 2: 実装**

`FlourPanel.tsx`：
- import `NameAutocomplete`
- Props に `suggest` 追加
- `flours.map` 内の name TextInput を `<NameAutocomplete testID={\`flour-name-${f.id}\`} value={f.name} onChangeText={(x) => onFlourName(f.id, x)} suggest={suggest} placeholder={t("flour")} ... />` に置換
- `styles.flourRow` に `overflow: "visible"` 追加（既存 row が overlay を切らないように）

- [ ] **Step 3: テスト pass**

```bash
npx jest components/recipe/form/FlourPanel.test.tsx
```

- [ ] **Step 4: コミット**

```bash
git add components/recipe/form/FlourPanel.tsx components/recipe/form/FlourPanel.test.tsx
git commit -m "feat: wire NameAutocomplete into FlourPanel name inputs"
```

---

## Task 9: `IngredientRow` の材料名入力を `NameAutocomplete` に差し替え

**Files:**
- Modify: `components/recipe/form/IngredientRow.tsx`
- Modify: `components/recipe/form/IngredientRow.test.tsx`

**契約:**
- Props に `suggest: (query: string) => string[]` を追加（required）。
- 既存 `ingredient-name-${id}` testID は `NameAutocomplete` の `testID` として渡す。
- 既存テストは `suggest: () => []` を追加。
- row 自体のスタイルに `overflow: "visible"` を確認 / 追加。

- [ ] **Step 1: 既存テスト更新**

`IngredientRow.test.tsx` の各レンダーに `suggest={() => []}` を追加。

- [ ] **Step 2: 実装**

`IngredientRow.tsx`：
- import `NameAutocomplete`
- Props に `suggest` 追加
- name TextInput を `NameAutocomplete` に置換、その他の prop（placeholder、style）はそのまま
- `styles.row` に `overflow: "visible"` 追加

- [ ] **Step 3: テスト pass**

```bash
npx jest components/recipe/form/IngredientRow.test.tsx
```

- [ ] **Step 4: コミット**

```bash
git add components/recipe/form/IngredientRow.tsx components/recipe/form/IngredientRow.test.tsx
git commit -m "feat: wire NameAutocomplete into IngredientRow name inputs"
```

---

## Task 10: `RecipeForm` に suggestions hook 統合 + yield input 追加

**Files:**
- Modify: `components/recipe/RecipeForm.tsx`
- Modify: `__tests__/recipe-form.test.tsx`

**契約:**
- `RecipeForm` の中で `const { forFlour, forOther } = useIngredientSuggestions()`。
- `<FlourPanel ... suggest={forFlour} />` と `<IngredientRow ... suggest={forOther} />`（各 row 共通の forOther を渡す）。
- タグ chips の **下** に yield TextInput を追加：
  - `testID="recipe-yield"`
  - `value={form.draft.yield ?? ""}`
  - `onChangeText={form.setYield}`
  - `placeholder={t("yieldPlaceholder")}`
  - style は既存 `styles.field` と同じ見た目（1 行 input）
- 必要なら `lib/i18n/LanguageProvider` から `useT` 経由で placeholder を取る（既に `useT` 取得済み）。

**テスト追加:**
- yield 入力で setYield が呼ばれる
- 既存テスト群が pass のまま（hook の `useFocusEffect` モックは `@react-navigation/native` の既存モックで OK）

- [ ] **Step 1: テスト追加・更新（failing or passing 確認）**

`__tests__/recipe-form.test.tsx`：
- `useIngredientSuggestions` を直接モックする選択肢もあるが、よりシンプルには既存の `@react-navigation/native` モックで `useFocusEffect` が即時に発火するため、`recipeRepository` から実際の状態を読む。新規作成テストでは `await save({...})` で前提を作っておいてもよい。最小限：

```tsx
it("captures yield input", () => {
  renderWithProvider(<RecipeForm initial={null} />);
  fireEvent.changeText(screen.getByTestId("recipe-yield"), "1斤型1つ分");
  expect(screen.getByDisplayValue("1斤型1つ分")).toBeTruthy();
});
```

- [ ] **Step 2: 実装**

`RecipeForm.tsx`：
- `import { useIngredientSuggestions } from "@/lib/recipes/useIngredientSuggestions";`
- ハンドラー設定の下で `const { forFlour, forOther } = useIngredientSuggestions();`
- `<FlourPanel ... suggest={forFlour} />`
- `<IngredientRow ... suggest={forOther} />`
- `<TagChips ... />` の **直下** に：

```tsx
<TextInput
  testID="recipe-yield"
  value={form.draft.yield ?? ""}
  onChangeText={form.setYield}
  placeholder={t("yieldPlaceholder")}
  placeholderTextColor={theme.colors.textSecondary}
  style={[
    styles.field,
    { color: theme.colors.textPrimary, borderColor: theme.colors.border },
  ]}
/>
```

- [ ] **Step 3: 全テスト pass**

```bash
npx jest
```

- [ ] **Step 4: tsc / lint clean**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 5: コミット**

```bash
git add components/recipe/RecipeForm.tsx __tests__/recipe-form.test.tsx
git commit -m "feat: wire ingredient suggestions and yield input into the recipe form"
```

---

## 完了基準

- 新規作成画面で材料名 / 粉名にフォーカスして候補 overlay が表示される（過去レシピが 1 つ以上ある場合）。
- 粉行で「水」がサジェストされない、材料行で「強力粉」がサジェストされない（辞書分離）。
- 候補タップで name が確定する。
- リストカードに yield が先頭に出る（あれば）。
- yield 未入力時はリストプレビューの format に影響なし。
- 全 unit / RNTL テスト pass、`tsc --noEmit` clean、`npm run lint` clean。

実機で要確認（spec の Section 2 / 4 参照）:
- overlay の z-index / 影 / 角丸が下の行に重なって違和感ないか。
- iOS / Android で `onBlur` → `setTimeout(... 0)` の race 制御が候補タップを取りこぼさないか。
- yield placeholder が縦長 / 横長端末で折返しせず収まるか。
