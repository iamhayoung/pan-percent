# feature/recipe-storage 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** レシピのドメイン型・ベーカーズパーセント計算（純粋関数）・端末ローカル永続化（リポジトリ層）を、テスト付きで構築する。UI を持たないデータ/ロジック基盤。

**Architecture:** ロジックは `lib/` の純粋関数とリポジトリ層に集約し、UI（後続ブランチ）はリポジトリ層越しにのみデータへアクセスする。計算は副作用ゼロの純粋関数。永続化は AsyncStorage の単一キー（`@pan-percent/recipes`）に全レシピを JSON 配列で保存。id（UUID）と時刻の付与という副作用はリポジトリ層に集約し、`save()` は upsert として振る舞う。

**Tech Stack:** TypeScript 5.9, jest-expo + @testing-library/react-native, `@react-native-async-storage/async-storage`, `expo-crypto`（randomUUID）。

参照 spec: `docs/specs/pan-percent-app-design.md`（§4 データモデル・計算, §10 永続化, §11 テスト）

---

## File Structure

作成/変更するファイルと責務：

- `types/recipe.ts` — `Ingredient` / `Recipe` / `RecipeDraft` 型定義（ドメイン型）
- `lib/bakers/calculate.ts` — `totalFlour` / `totalWeight` / `bakerPercents` / `scaleToFlour`（純粋関数）
- `lib/bakers/calculate.test.ts` — 計算のテスト
- `lib/recipes/recipeRepository.ts` — `list` / `get` / `save`(upsert) / `remove`（AsyncStorage CRUD）
- `lib/recipes/recipeRepository.test.ts` — リポジトリのテスト
- `jest.setup.js`（作成）— AsyncStorage の公式 jest モック登録
- `package.json`（変更）— 依存追加・`jest.setupFiles` 追加

各テストはソースに併置。型は型チェッカ（`tsc --noEmit`）で検証する。

---

## Task 1: 依存追加とテストモックのセットアップ

**Files:**
- Modify: `package.json`
- Create: `jest.setup.js`

- [ ] **Step 1: 依存をインストール**

```bash
npx expo install @react-native-async-storage/async-storage expo-crypto
```

Expected: SDK54 互換版が追加され、エラーなく完了する。

- [ ] **Step 2: バージョンを exact 固定に直す**

`expo install` は `~`/`^` を付ける場合がある。`package.json` の `@react-native-async-storage/async-storage` と `expo-crypto` の version から先頭の `~`/`^` を削除して exact 固定にする（renovate 管理方針）。修正後に lock を整合させる：

```bash
npm install
```

Run: `node -e "const p=require('./package.json'); console.log(p.dependencies['@react-native-async-storage/async-storage'], p.dependencies['expo-crypto'])"`
Expected: どちらも先頭に `~`/`^` が無いバージョン文字列。

- [ ] **Step 3: app.json に config plugin 追記が入っていないか確認**

Run: `git status --short app.json`
Expected: 通常これらは config plugin 不要。差分が出た場合のみ、依存コミットに含める（出なければ何もしない）。

- [ ] **Step 4: AsyncStorage の jest モックを登録する setup ファイルを作成**

Create `jest.setup.js`:

```js
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
```

- [ ] **Step 5: package.json の jest 設定に setupFiles を追加**

`package.json` の `jest` キーを次の通りにする：

```json
"jest": {
  "preset": "jest-expo",
  "setupFiles": ["<rootDir>/jest.setup.js"]
}
```

- [ ] **Step 6: 既存テストが壊れていないことを確認**

Run: `npm test`
Expected: 既存の i18n / theme テストが引き続き PASS（setup 追加で壊れない）。

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json jest.setup.js
git commit -m "chore: add async-storage and expo-crypto with jest setup" -m "Add @react-native-async-storage/async-storage and expo-crypto for the
recipe repository, pinned to exact versions. Register the official
AsyncStorage jest mock via setupFiles so repository tests run against an
in-memory store."
```

> app.json に差分が出た場合は同じコミットに `git add app.json` を含める。

---

## Task 2: ドメイン型の定義

**Files:**
- Create: `types/recipe.ts`

型のみのため実行時テストは無し。型チェッカ（`tsc --noEmit`）と後続タスクのテストが利用時に検証する。

- [ ] **Step 1: 型を実装**

Create `types/recipe.ts`:

```ts
export type Ingredient = {
  id: string;
  name: string;
  grams: number;
  isFlour: boolean;
};

export type Recipe = {
  id: string;
  name: string;
  ingredients: Ingredient[];
  memo?: string;
  photoUri?: string;
  tags: string[];
  bake?: { temperatureC?: number; minutes?: number };
  createdAt: number;
  updatedAt: number;
};

export type RecipeDraft = Omit<Recipe, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};
```

- [ ] **Step 2: 型チェックと lint を実行**

Run: `npx tsc --noEmit && npm run lint`
Expected: どちらもエラー無し。

- [ ] **Step 3: Commit**

```bash
git add types/recipe.ts
git commit -m "feat: add recipe domain types" -m "Define Ingredient and Recipe domain types, plus RecipeDraft (Recipe
without id/timestamps, with optional id) used as the upsert input for
the repository layer."
```

---

## Task 3: ベーカーズパーセント計算（純粋関数・TDD）

**Files:**
- Create: `lib/bakers/calculate.ts`
- Test: `lib/bakers/calculate.test.ts`

ベーカーズパーセントの定義: 粉（`isFlour=true`）の合計を 100% とし、各材料を粉に対する比率で表す。粉が 0 のときは比率計算不能（`null`）。

- [ ] **Step 1: 失敗するテストを書く**

Create `lib/bakers/calculate.test.ts`:

```ts
import type { Ingredient } from "@/types/recipe";
import { bakerPercents, scaleToFlour, totalFlour, totalWeight } from "./calculate";

const ing = (id: string, grams: number, isFlour: boolean): Ingredient => ({
  id,
  name: id,
  grams,
  isFlour,
});

describe("totalFlour / totalWeight", () => {
  it("sums flour grams and all grams", () => {
    const items = [ing("a", 500, true), ing("b", 350, false), ing("c", 100, true)];
    expect(totalFlour(items)).toBe(600);
    expect(totalWeight(items)).toBe(950);
  });
});

describe("bakerPercents", () => {
  it("expresses each ingredient relative to total flour (= 100%)", () => {
    const items = [ing("flour", 500, true), ing("water", 350, false), ing("salt", 10, false)];
    expect(bakerPercents(items)).toEqual([
      { id: "flour", percent: 100 },
      { id: "water", percent: 70 },
      { id: "salt", percent: 2 },
    ]);
  });

  it("returns null percents when there is no flour", () => {
    const items = [ing("water", 350, false)];
    expect(bakerPercents(items)).toEqual([{ id: "water", percent: null }]);
  });
});

describe("scaleToFlour", () => {
  it("scales grams to the target flour while keeping ratios", () => {
    const items = [ing("flour", 500, true), ing("water", 350, false)];
    expect(scaleToFlour(items, 1000)).toEqual([
      { id: "flour", name: "flour", grams: 1000, isFlour: true },
      { id: "water", name: "water", grams: 700, isFlour: false },
    ]);
  });

  it("returns null when flour is zero or the target is invalid", () => {
    expect(scaleToFlour([ing("water", 350, false)], 1000)).toBeNull();
    expect(scaleToFlour([ing("flour", 500, true)], 0)).toBeNull();
    expect(scaleToFlour([ing("flour", 500, true)], Number.NaN)).toBeNull();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- calculate`
Expected: FAIL（`Cannot find module './calculate'`）。

- [ ] **Step 3: 実装**

Create `lib/bakers/calculate.ts`:

```ts
import type { Ingredient } from "@/types/recipe";

export type BakerPercent = { id: string; percent: number | null };

export function totalFlour(ingredients: Ingredient[]): number {
  return ingredients
    .filter((ingredient) => ingredient.isFlour)
    .reduce((sum, ingredient) => sum + ingredient.grams, 0);
}

export function totalWeight(ingredients: Ingredient[]): number {
  return ingredients.reduce((sum, ingredient) => sum + ingredient.grams, 0);
}

export function bakerPercents(ingredients: Ingredient[]): BakerPercent[] {
  const flour = totalFlour(ingredients);
  return ingredients.map((ingredient) => ({
    id: ingredient.id,
    percent: flour > 0 ? (ingredient.grams / flour) * 100 : null,
  }));
}

export function scaleToFlour(
  ingredients: Ingredient[],
  targetFlour: number,
): Ingredient[] | null {
  const flour = totalFlour(ingredients);
  if (flour <= 0 || !Number.isFinite(targetFlour) || targetFlour <= 0) {
    return null;
  }
  const factor = targetFlour / flour;
  return ingredients.map((ingredient) => ({
    ...ingredient,
    grams: ingredient.grams * factor,
  }));
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- calculate`
Expected: PASS（全 5 ケース）。

- [ ] **Step 5: 型チェックと lint を実行**

Run: `npx tsc --noEmit && npm run lint`
Expected: エラー無し（必要なら `npm run lint:fix` で整形）。

- [ ] **Step 6: Commit**

```bash
git add lib/bakers/calculate.ts lib/bakers/calculate.test.ts
git commit -m "feat: add baker's percentage calculation" -m "Add pure functions for the baker's percentage model: totalFlour,
totalWeight, bakerPercents (per-ingredient ratio to total flour, null
when there is no flour) and scaleToFlour (rescale grams to a target
flour, null when flour is zero or the target is invalid)."
```

---

## Task 4: レシピリポジトリ層（AsyncStorage CRUD・TDD）

**Files:**
- Create: `lib/recipes/recipeRepository.ts`
- Test: `lib/recipes/recipeRepository.test.ts`

UI はこの層越しにのみデータへアクセスする。単一キー `@pan-percent/recipes` に全レシピを JSON 配列で保存。`save` は upsert（id 無し→新規生成、id 有り→更新）。id/時刻の副作用はこの層に集約。

- [ ] **Step 1: 失敗するテストを書く**

`expo-crypto.randomUUID` と `Date.now` をモックして決定的に検証する。`as`（型アサーション）は使わず `jest.mocked()` を使う。

Create `lib/recipes/recipeRepository.test.ts`:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import type { RecipeDraft } from "@/types/recipe";
import { get, list, remove, save } from "./recipeRepository";

jest.mock("expo-crypto", () => ({ randomUUID: jest.fn() }));

const draft = (name: string): RecipeDraft => ({
  name,
  ingredients: [{ id: "i1", name: "flour", grams: 500, isFlour: true }],
  tags: [],
});

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.restoreAllMocks();
  jest.mocked(randomUUID).mockReturnValue("uuid-1");
  jest.spyOn(Date, "now").mockReturnValue(1000);
});

describe("recipeRepository", () => {
  it("returns an empty list when nothing is stored", async () => {
    expect(await list()).toEqual([]);
  });

  it("creates a recipe with a generated id and timestamps", async () => {
    const saved = await save(draft("Baguette"));

    expect(saved.id).toBe("uuid-1");
    expect(saved.createdAt).toBe(1000);
    expect(saved.updatedAt).toBe(1000);
    expect(await list()).toEqual([saved]);
  });

  it("updates an existing recipe, preserving id and createdAt", async () => {
    const created = await save(draft("Baguette"));
    jest.spyOn(Date, "now").mockReturnValue(2000);

    const updated = await save({ ...draft("Sourdough"), id: created.id });

    expect(updated.id).toBe("uuid-1");
    expect(updated.name).toBe("Sourdough");
    expect(updated.createdAt).toBe(1000);
    expect(updated.updatedAt).toBe(2000);
    expect(await list()).toHaveLength(1);
  });

  it("gets a recipe by id and returns null when missing", async () => {
    const created = await save(draft("Baguette"));

    expect(await get("uuid-1")).toEqual(created);
    expect(await get("missing")).toBeNull();
  });

  it("removes a recipe by id", async () => {
    await save(draft("Baguette"));

    await remove("uuid-1");

    expect(await list()).toEqual([]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- recipeRepository`
Expected: FAIL（`Cannot find module './recipeRepository'`）。

- [ ] **Step 3: 実装**

Create `lib/recipes/recipeRepository.ts`:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import type { Recipe, RecipeDraft } from "@/types/recipe";

const STORAGE_KEY = "@pan-percent/recipes";

async function readAll(): Promise<Recipe[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return [];
  }
  const parsed: Recipe[] = JSON.parse(raw);
  return parsed;
}

async function writeAll(recipes: Recipe[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

export async function list(): Promise<Recipe[]> {
  return readAll();
}

export async function get(id: string): Promise<Recipe | null> {
  const recipes = await readAll();
  return recipes.find((recipe) => recipe.id === id) ?? null;
}

export async function save(draft: RecipeDraft): Promise<Recipe> {
  const recipes = await readAll();
  const now = Date.now();
  const index = draft.id
    ? recipes.findIndex((recipe) => recipe.id === draft.id)
    : -1;

  if (index >= 0) {
    const updated: Recipe = {
      ...draft,
      id: recipes[index].id,
      createdAt: recipes[index].createdAt,
      updatedAt: now,
    };
    const next = [...recipes];
    next[index] = updated;
    await writeAll(next);
    return updated;
  }

  const created: Recipe = {
    ...draft,
    id: draft.id ?? randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  await writeAll([...recipes, created]);
  return created;
}

export async function remove(id: string): Promise<void> {
  const recipes = await readAll();
  await writeAll(recipes.filter((recipe) => recipe.id !== id));
}
```

> 注: `JSON.parse` は `any` を返すため、`const parsed: Recipe[] = JSON.parse(raw)` で型アサーション（`as`）無しに復元できる。実行時のスキーマ検証（破損データ対策）は本ブランチ非対象。将来 zod 等で挟む場合は別タスク化する。

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- recipeRepository`
Expected: PASS（全 5 ケース）。

- [ ] **Step 5: 型チェック・lint・全テストを実行**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: 型エラー無し、lint エラー無し、全テスト PASS。

- [ ] **Step 6: Commit**

```bash
git add lib/recipes/recipeRepository.ts lib/recipes/recipeRepository.test.ts
git commit -m "feat: add recipe repository over AsyncStorage" -m "Persist all recipes as a JSON array under a single AsyncStorage key.
Expose list/get/save/remove; save() upserts, generating a UUID and
createdAt for new drafts and bumping updatedAt on every write. The id
and clock side effects live in this layer so the UI stays declarative."
```

---

## 完了条件

- `npm run lint`・`npx tsc --noEmit`・`npm test` がすべて成功
- `types/recipe.ts` に `Ingredient` / `Recipe` / `RecipeDraft` が定義済み
- `lib/bakers/calculate.ts` が比率・合計・スケールを純粋関数で提供し、粉 0 を `null` で安全に扱う（テスト済み）
- `lib/recipes/recipeRepository.ts` が単一キー配列で list/get/save(upsert)/remove を提供（テスト済み、id/時刻はモックで決定的に検証）
- 追加依存（async-storage / expo-crypto）が exact 固定で導入済み

このブランチ完了後、`feature/recipe-list-detail`（一覧・詳細・スケール表示 UI）のプランへ進む。

---

## Self-Review メモ（spec カバレッジ）

- spec §4 型定義 → Task 2 ✅ / 計算ロジック・粉0エッジ → Task 3 ✅
- spec §10 永続化（list/get/save/remove・単一キー・UUID via expo-crypto） → Task 4 ✅
- spec §11 テスト（純粋関数の単体・リポジトリは AsyncStorage モックで結合） → Task 1・3・4 ✅
- 写真ファイルの後始末（spec §10）は本ブランチ非対象（recipe-form ブランチへ）。`remove` はレコード削除のみ ✅
- g の負数・非数バリデーション（spec §4）は UI 責務のため本ブランチ非対象（純粋関数は 0 除算系のみ防御） ✅
