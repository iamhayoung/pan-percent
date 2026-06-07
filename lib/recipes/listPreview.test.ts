import type { Recipe } from "@/types/recipe";
import { buildListPreview } from "./listPreview";

const recipe = (overrides: Partial<Recipe>): Recipe => ({
  id: "r1",
  name: "Test",
  ingredients: [],
  tags: [],
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

describe("buildListPreview", () => {
  it("lists every ingredient with its grams in the registered order", () => {
    const r = recipe({
      ingredients: [
        { id: "flour", name: "Bread flour", grams: 500, isFlour: true },
        { id: "water", name: "Water", grams: 350, isFlour: false },
        { id: "salt", name: "Salt", grams: 10, isFlour: false },
        { id: "yeast", name: "Yeast", grams: 5, isFlour: false },
      ],
    });

    expect(buildListPreview(r)).toBe(
      "Bread flour 500g · Water 350g · Salt 10g · Yeast 5g",
    );
  });

  it("includes every flour when multiple flours are blended", () => {
    const r = recipe({
      ingredients: [
        { id: "f1", name: "Bread flour", grams: 400, isFlour: true },
        { id: "f2", name: "Whole wheat", grams: 100, isFlour: true },
        { id: "water", name: "Water", grams: 350, isFlour: false },
      ],
    });

    expect(buildListPreview(r)).toBe(
      "Bread flour 400g · Whole wheat 100g · Water 350g",
    );
  });

  it("omits ingredients with empty names or zero grams", () => {
    const r = recipe({
      ingredients: [
        { id: "flour", name: "Bread flour", grams: 500, isFlour: true },
        { id: "water", name: "Water", grams: 350, isFlour: false },
        { id: "empty", name: "", grams: 10, isFlour: false },
        { id: "zero", name: "Salt", grams: 0, isFlour: false },
      ],
    });

    expect(buildListPreview(r)).toBe("Bread flour 500g · Water 350g");
  });

  it("returns just the flour when there are no other ingredients", () => {
    const r = recipe({
      ingredients: [
        { id: "flour", name: "Bread flour", grams: 250, isFlour: true },
      ],
    });

    expect(buildListPreview(r)).toBe("Bread flour 250g");
  });

  it("returns an empty string when nothing is filled in", () => {
    const r = recipe({ ingredients: [] });
    expect(buildListPreview(r)).toBe("");
  });

  it("formats decimal grams to one place", () => {
    const r = recipe({
      ingredients: [
        { id: "flour", name: "Bread flour", grams: 250.5, isFlour: true },
        { id: "salt", name: "Salt", grams: 1.5, isFlour: false },
      ],
    });

    expect(buildListPreview(r)).toBe("Bread flour 250.5g · Salt 1.5g");
  });

  it("preserves the user's names across locales", () => {
    const r = recipe({
      ingredients: [
        { id: "flour", name: "強力粉", grams: 500, isFlour: true },
        { id: "water", name: "水", grams: 350, isFlour: false },
      ],
    });

    expect(buildListPreview(r)).toBe("強力粉 500g · 水 350g");
  });
});
