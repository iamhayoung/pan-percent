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
  it("starts a new draft with one flour and one ingredient row", () => {
    const { result } = renderHook(() => useRecipeForm(null));

    const flours = result.current.draft.ingredients.filter((i) => i.isFlour);
    const others = result.current.draft.ingredients.filter((i) => !i.isFlour);
    expect(flours).toHaveLength(1);
    expect(others).toHaveLength(1);
  });

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

  it("sets and clears yield text", () => {
    const { result } = renderHook(() => useRecipeForm(null));

    expect(result.current.draft.yield).toBeUndefined();

    act(() => result.current.setYield("1斤型1つ分"));
    expect(result.current.draft.yield).toBe("1斤型1つ分");

    act(() => result.current.setYield(""));
    expect(result.current.draft.yield).toBe("");
  });

  it("sets and clears the photo uri", () => {
    const { result } = renderHook(() => useRecipeForm(null));

    expect(result.current.draft.photoUri).toBeUndefined();

    act(() => result.current.setPhotoUri("file:///tmp/photo.jpg"));
    expect(result.current.draft.photoUri).toBe("file:///tmp/photo.jpg");

    act(() => result.current.setPhotoUri(undefined));
    expect(result.current.draft.photoUri).toBeUndefined();
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

  it("assigns the target grams to the first flour when the current total is zero", () => {
    const { result } = renderHook(() => useRecipeForm(null));
    const flourId = result.current.draft.ingredients[0].id;

    act(() => result.current.scaleTotalFlour(250));

    expect(
      result.current.draft.ingredients.find((i) => i.id === flourId)?.grams,
    ).toBe(250);
    expect(result.current.totalFlour).toBe(250);
  });

  it("clears all flour grams when the scale target is zero, leaving other ingredients", () => {
    const initial = recipe([
      { id: "flour-a", name: "強力粉", grams: 300, isFlour: true },
      { id: "flour-b", name: "全粒粉", grams: 200, isFlour: true },
      { id: "water", name: "水", grams: 350, isFlour: false },
    ]);
    const { result } = renderHook(() => useRecipeForm(initial));

    act(() => result.current.scaleTotalFlour(0));

    expect(result.current.totalFlour).toBe(0);
    const ings = result.current.draft.ingredients;
    expect(ings.find((i) => i.id === "flour-a")?.grams).toBe(0);
    expect(ings.find((i) => i.id === "flour-b")?.grams).toBe(0);
    expect(ings.find((i) => i.id === "water")?.grams).toBe(350);
  });

  it("ignores negative scale targets", () => {
    const initial = recipe([
      { id: "flour", name: "強力粉", grams: 500, isFlour: true },
      { id: "water", name: "水", grams: 350, isFlour: false },
    ]);
    const { result } = renderHook(() => useRecipeForm(initial));

    act(() => result.current.scaleTotalFlour(-100));
    expect(result.current.totalFlour).toBe(500);
  });
});

describe("useRecipeForm.isValid", () => {
  it("is invalid when the name is empty", () => {
    const initial = recipe([
      { id: "flour", name: "強力粉", grams: 500, isFlour: true },
      { id: "water", name: "水", grams: 350, isFlour: false },
    ]);
    const { result } = renderHook(() => useRecipeForm(initial));

    act(() => result.current.setName(""));

    expect(result.current.isValid).toBe(false);
  });

  it("is invalid when a flour row has an empty name or zero grams", () => {
    const initial = recipe([
      { id: "flour", name: "", grams: 500, isFlour: true },
      { id: "water", name: "水", grams: 350, isFlour: false },
    ]);
    const { result } = renderHook(() => useRecipeForm(initial));
    expect(result.current.isValid).toBe(false);

    const zeroFlour = recipe([
      { id: "flour", name: "強力粉", grams: 0, isFlour: true },
      { id: "water", name: "水", grams: 350, isFlour: false },
    ]);
    const { result: r2 } = renderHook(() => useRecipeForm(zeroFlour));
    expect(r2.current.isValid).toBe(false);
  });

  it("is invalid when there are no non-flour ingredients", () => {
    const initial = recipe([
      { id: "flour", name: "強力粉", grams: 500, isFlour: true },
    ]);
    const { result } = renderHook(() => useRecipeForm(initial));
    expect(result.current.isValid).toBe(false);
  });

  it("is invalid when an ingredient row has an empty name or zero grams", () => {
    const initial = recipe([
      { id: "flour", name: "強力粉", grams: 500, isFlour: true },
      { id: "water", name: "", grams: 350, isFlour: false },
    ]);
    const { result } = renderHook(() => useRecipeForm(initial));
    expect(result.current.isValid).toBe(false);

    const zeroOther = recipe([
      { id: "flour", name: "強力粉", grams: 500, isFlour: true },
      { id: "water", name: "水", grams: 0, isFlour: false },
    ]);
    const { result: r2 } = renderHook(() => useRecipeForm(zeroOther));
    expect(r2.current.isValid).toBe(false);
  });

  it("is valid when name, all flours, and at least one ingredient are filled", () => {
    const initial = recipe([
      { id: "flour", name: "強力粉", grams: 500, isFlour: true },
      { id: "water", name: "水", grams: 350, isFlour: false },
    ]);
    const { result } = renderHook(() => useRecipeForm(initial));
    expect(result.current.isValid).toBe(true);
  });
});
