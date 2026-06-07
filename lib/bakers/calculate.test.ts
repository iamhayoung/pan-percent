import type { Ingredient } from "@/types/recipe";
import {
  bakerPercents,
  gramsFromPercent,
  scaleToFlour,
  totalFlour,
  totalWeight,
} from "./calculate";

const ing = (id: string, grams: number, isFlour: boolean): Ingredient => ({
  id,
  name: id,
  grams,
  isFlour,
});

describe("totalFlour / totalWeight", () => {
  it("sums flour grams and all grams", () => {
    const items = [
      ing("a", 500, true),
      ing("b", 350, false),
      ing("c", 100, true),
    ];
    expect(totalFlour(items)).toBe(600);
    expect(totalWeight(items)).toBe(950);
  });
});

describe("bakerPercents", () => {
  it("expresses each ingredient relative to total flour (= 100%)", () => {
    const items = [
      ing("flour", 500, true),
      ing("water", 350, false),
      ing("salt", 10, false),
    ];
    expect(bakerPercents(items)).toEqual([
      { id: "flour", percent: 100 },
      { id: "water", percent: 70 },
      { id: "salt", percent: 2 },
    ]);
  });

  it("returns null percents when there is no flour", () => {
    expect(bakerPercents([ing("water", 350, false)])).toEqual([
      { id: "water", percent: null },
    ]);
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

  it("rounds the scaled grams to one decimal place", () => {
    const items = [ing("flour", 550, true), ing("water", 385, false)];
    const scaled = scaleToFlour(items, 560);

    expect(scaled).toEqual([
      { id: "flour", name: "flour", grams: 560, isFlour: true },
      { id: "water", name: "water", grams: 392, isFlour: false },
    ]);
  });

  it("preserves a 0.1 g step when scaling", () => {
    const items = [ing("flour", 100, true), ing("salt", 1.5, false)];
    const scaled = scaleToFlour(items, 250);

    expect(scaled).toEqual([
      { id: "flour", name: "flour", grams: 250, isFlour: true },
      { id: "salt", name: "salt", grams: 3.8, isFlour: false },
    ]);
  });
});

describe("gramsFromPercent", () => {
  it("converts a percent of total flour to grams", () => {
    expect(gramsFromPercent(70, 500)).toBe(350);
    expect(gramsFromPercent(2, 500)).toBe(10);
  });

  it("returns null when flour is zero or the percent is invalid", () => {
    expect(gramsFromPercent(70, 0)).toBeNull();
    expect(gramsFromPercent(Number.NaN, 500)).toBeNull();
  });
});
