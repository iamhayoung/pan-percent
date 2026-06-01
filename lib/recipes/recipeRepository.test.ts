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
