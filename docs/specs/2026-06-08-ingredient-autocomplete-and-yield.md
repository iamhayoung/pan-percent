# Ingredient Autocomplete + Recipe Yield — Design

Status: **autocomplete 棚上げ (SHELVED · 2026-07-22) / yield 採用済み (SHIPPED)**
Date: 2026-06-08
Target branch: `feature/ingredient-autocomplete`

> autocomplete は実機で動かず撤回し、材料名は素の TextInput に戻した。yield フィールドのみ採用。経緯・学びはメモリー `autocomplete-rn-trials.md`。以下の autocomplete 部分は当時の設計記録として残す。

## Overview

Two related additions to the recipe editor.

1. **Ingredient name autocomplete** — when a user focuses an ingredient name input, surface an overlay list of previously used names (built from past recipes), filtered and ranked by usage. Flour rows and non-flour rows use separate dictionaries so a flour input never suggests "water".
2. **Recipe yield field** — a free-text optional field (e.g. "1 loaf pan", "8 pieces") rendered under the tag chips in the editor. It also leads the recipe list preview so two recipes with the same title and ingredients can be distinguished by what they actually make.

Both ship together because the form-level changes touch overlapping files and the user wants the yield field "along the way".

## Goals

- Cut typing and typo risk when entering ingredient names that the user has used before.
- Keep flour-only and other-only dictionaries separate so the suggestions stay contextually correct.
- Let users record a per-recipe yield (mold size, piece count, etc.) in their own words, no i18n catalog required.
- Make same-named recipes distinguishable in the list preview by leading with the yield.

## Non-Goals

- A Settings screen for managing presets or pinning favorites. The user explicitly opted out for this phase; treated as a future extension point.
- Built-in multilingual preset catalog. The user's typed strings are the only source.
- Manual reordering of suggestions. Usage-count ordering is sufficient.
- Excluding the currently-edited recipe from its own suggestion source. Kept simple; the impact is negligible because the edited values reappear as suggestions only after save.

## Data Model

`types/recipe.ts`

```ts
export type Recipe = {
  id: string;
  name: string;
  ingredients: Ingredient[];
  memo?: string;
  photoUri?: string;
  yield?: string;       // NEW: free-text, e.g. "1 loaf pan", "8 pieces"
  tags: string[];
  bake?: { temperatureC?: number; minutes?: number };
  createdAt: number;
  updatedAt: number;
};
```

No migration is required — existing recipes simply have `yield` undefined, and `RecipeDraft` inherits the optional field.

## UI

### Editor screen layout (changes only)

The tag chips row is followed by a new yield TextInput (no `(optional)` label, matching the other inputs).

```
[Photo thumb]
[Recipe name]
[Last updated …]
[Flour panel]
[Ingredient panel]
[Tag chips]
[Yield input]   ← NEW
[Bake row (temp / min)]
[Memo]
[Delete] (only when editing)
[Save bar]  (pinned)
```

`Yield` placeholders (each phrased natively, no `e.g.` prefix):

| Locale | Placeholder |
|---|---|
| `en` | `1 loaf pan, 8 pieces` |
| `ja` | `1斤型1つ分、8個分` |
| `ko` | `식빵틀 1개 분량, 8개분` |

### Autocomplete overlay

- Trigger: TextInput `onFocus`.
- Position: absolute, immediately under the focused TextInput (`top: "100%"`), with a high `zIndex` so it covers the rows below.
- Layout consequence: the lower rows are visually hidden by the overlay while it is open. They are not pushed down.
- Empty results (whether the dictionary is empty or the query filters everything out): the overlay does not render.
- Selection: tapping a suggestion sets the name and dismisses the keyboard; tapping outside the input dismisses the overlay via blur.

### List preview (changes only)

`buildListPreview(recipe)` prepends the yield when present:

- With yield: `1 loaf pan · Bread flour 500g · Water 350g · Salt 10g`
- Without yield: `Bread flour 500g · Water 350g · Salt 10g` (unchanged)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ RecipeForm                                                  │
│  ├─ useIngredientSuggestions() → { forFlour, forOther }     │
│  ├─ FlourPanel    (suggest=forFlour)                        │
│  └─ IngredientRow (suggest=forOther)                        │
│       └─ NameAutocomplete (TextInput + overlay)             │
│                                                             │
│  Yield TextInput (form.draft.yield, form.setYield)          │
└─────────────────────────────────────────────────────────────┘

useIngredientSuggestions
  ↳ recipeRepository.list()                  (load on focus)
  ↳ buildSuggestions(recipes, isFlour, q)    (pure, memoized)
```

### Pure ranking function

`lib/recipes/ingredientSuggestions.ts`

```ts
export function buildSuggestions(
  recipes: Recipe[],
  isFlour: boolean,
  query: string,
): string[]
```

Behavior:
1. Flatten every recipe's `ingredients`.
2. Keep only entries where `ingredient.isFlour === isFlour` and `name.trim() !== ""`.
3. Tally `Map<name, count>` keyed by `name.trim()` (case-sensitive for storage, see step 5 for matching).
4. If `query.trim()` is non-empty: keep entries where `name.toLowerCase().includes(query.trim().toLowerCase())` (partial, case-insensitive — Japanese / Korean need partial; English benefits too).
5. Sort by count descending; ties broken by first-seen order (stable sort).
6. Return the first 5 names. (Constant `MAX_SUGGESTIONS = 5`.)

Edge cases:
- 0 recipes → `[]`.
- Empty `query` → return the top-5 globally (focus-just-opened state).
- Same `name` across flour and other → counted separately (no leakage).
- Whitespace-only name → excluded.

### Hook

`lib/recipes/useIngredientSuggestions.ts`

```ts
export function useIngredientSuggestions(): {
  forFlour: (query: string) => string[];
  forOther: (query: string) => string[];
}
```

- Holds `recipes` in `useState<Recipe[]>([])`.
- `useFocusEffect` (from `@react-navigation/native`) reloads `recipeRepository.list()` on screen focus.
- Returns memoized callback wrappers around `buildSuggestions` so the consumer can call them with any query without re-rendering on every keystroke. Memoization key is the `recipes` array reference.

### Autocomplete component

`components/recipe/form/NameAutocomplete.tsx`

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

State:
- `focused: boolean`
- `query` mirrors `value` for filtering (`suggest(value)` is recomputed on every render; cheap because the underlying function is memoized).

Behavior:
- `onFocus` sets `focused = true`.
- `onBlur` schedules `focused = false` via `setTimeout(... , 0)` so a tap on a suggestion (which races with blur) wins.
- Overlay is rendered only when `focused && suggest(value).length > 0`.
- Tapping a suggestion calls `onChangeText(name)` then `Keyboard.dismiss()` (which triggers the deferred blur).

Z-index strategy: overlay uses `position: "absolute"`, `top: "100%"`, `left: 0`, `right: 0`, `zIndex: 10`. `IngredientRow` and `FlourPanel` need `overflow: "visible"` so the overlay can extend beyond the row's bounding box; the parent `ScrollView`'s `contentContainerStyle` keeps a high enough `paddingBottom` for the existing save bar — the overlay will draw on top of the next row, which is intentional per Section 2.

### Form wiring

`useRecipeForm`:
- `setYield(value: string)` action added; updates `draft.yield`.
- Dirty/valid logic unchanged. Yield does not gate `isValid`.

`RecipeForm`:
- Calls `useIngredientSuggestions()` once and passes `forFlour` to `FlourPanel`, `forOther` to `IngredientRow` (per row).
- Renders the new yield TextInput between the tag chips and the bake row.

`FlourPanel` / `IngredientRow`:
- Replace the inner name `TextInput` with `NameAutocomplete`, threading the new `suggest` prop.
- Their existing tests gain the `suggest` argument (a `noop` function returning `[]` is fine for the default path).

### List preview

`lib/recipes/listPreview.ts` prepends `yield` when present, before the existing ingredient join. Existing tests cover the no-yield case; new tests cover the with-yield case (and skipping when blank).

## Behavior Details

- Suggestions update live as the user types — no debouncing. The pipeline is cheap (≤ a few hundred names tops).
- Selecting a suggestion does not auto-set `isFlour`. The row was already on the flour side or the ingredient side before focus.
- The overlay never shows the user's own current draft entries because those live in `form.draft.ingredients`, not in the persisted `recipes` snapshot used by the hook.
- Yield is sanitized only by `trim()` when read into the list preview. The editor stores whatever the user types.

## Tests

| File | Kind | Coverage |
|---|---|---|
| `lib/recipes/ingredientSuggestions.test.ts` | pure unit | basic ordering by count, partial / case-insensitive query, empty query, empty recipes, isFlour split, MAX_SUGGESTIONS cap, ties keep first-seen order, whitespace-only excluded |
| `lib/recipes/useIngredientSuggestions.test.tsx` | renderHook | initial empty, populates after `list()`, `forFlour` vs `forOther` keyed on `isFlour`, focus effect re-reads |
| `components/recipe/form/NameAutocomplete.test.tsx` | RNTL | shows overlay on focus when results present, hides when results empty, calls `onChangeText` with selected suggestion, overlay disappears after selection |
| `lib/recipes/listPreview.test.ts` (extend) | pure unit | yield prefix appears, blank yield is skipped |
| `lib/recipes/useRecipeForm.test.tsx` (extend) | renderHook | `setYield` sets and clears |
| `components/recipe/form/IngredientRow.test.tsx` (update) | RNTL | pass `suggest` prop; existing assertions unchanged |
| `components/recipe/form/FlourPanel.test.tsx` (update) | RNTL | same as above |

`jest.setup.js` already mocks `react-native-keyboard-controller` and `@react-navigation/elements`; no new global mocks are needed. `useFocusEffect` is mocked per-suite as today.

## Out of Scope / Future Extensions

- Settings screen to pin or curate favorite ingredient names.
- Showing each suggestion's recent usage count or a "used N times" badge.
- Yield as a structured type (mold size + piece count) — kept as free text for now.
- Excluding the currently-edited recipe from its own suggestion set.
