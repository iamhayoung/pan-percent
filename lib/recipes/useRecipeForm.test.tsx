import { act, renderHook } from "@testing-library/react-native";
import type { Ingredient, Recipe } from "@/types/recipe";
import { useRecipeForm } from "./useRecipeForm";

let mockIdn = 0;
jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => `id-${++mockIdn}`),
}));

const recipe = (ingredients: Ingredient[]): Recipe => ({
  id: "r1",
  name: "食パン",
  ingredients,
  tags: [],
  createdAt: 1,
  updatedAt: 1,
});

beforeEach(() => {
  mockIdn = 0;
});

describe("useRecipeForm", () => {
  it("starts not dirty and becomes dirty on edit", () => {
    const { result } = renderHook(() => useRecipeForm(null));

    expect(result.current.dirty).toBe(false);
    act(() => result.current.setName("食パン"));

    expect(result.current.dirty).toBe(true);
    expect(result.current.draft.name).toBe("食パン");
  });

  it("computes grams from an edited percent against total flour", () => {
    const initial = recipe([
      { id: "flour", name: "強力粉", grams: 500, isFlour: true },
      { id: "water", name: "水", grams: 0, isFlour: false },
    ]);
    const { result } = renderHook(() => useRecipeForm(initial));

    act(() => result.current.setIngredientPercent("water", 70));

    expect(
      result.current.draft.ingredients.find((i) => i.id === "water")?.grams,
    ).toBe(350);
  });

  it("scales all grams to the target total flour, keeping ratios", () => {
    const initial = recipe([
      { id: "flour", name: "強力粉", grams: 500, isFlour: true },
      { id: "water", name: "水", grams: 350, isFlour: false },
    ]);
    const { result } = renderHook(() => useRecipeForm(initial));

    act(() => result.current.scaleTotalFlour(1000));

    const ings = result.current.draft.ingredients;
    expect(ings.find((i) => i.id === "flour")?.grams).toBe(1000);
    expect(ings.find((i) => i.id === "water")?.grams).toBe(700);
  });

  it("adds and removes ingredients", () => {
    const { result } = renderHook(() => useRecipeForm(null));
    const before = result.current.draft.ingredients.length;

    act(() => result.current.addIngredient());
    expect(result.current.draft.ingredients.length).toBe(before + 1);

    const added =
      result.current.draft.ingredients[
        result.current.draft.ingredients.length - 1
      ];
    act(() => result.current.removeIngredient(added.id));
    expect(result.current.draft.ingredients.length).toBe(before);
  });

  it("does not change grams when there is no flour", () => {
    const initial = recipe([
      { id: "water", name: "水", grams: 100, isFlour: false },
    ]);
    const { result } = renderHook(() => useRecipeForm(initial));

    act(() => result.current.setIngredientPercent("water", 70));

    expect(
      result.current.draft.ingredients.find((i) => i.id === "water")?.grams,
    ).toBe(100);
  });
});
