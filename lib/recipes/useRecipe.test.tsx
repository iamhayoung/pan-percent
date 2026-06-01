import AsyncStorage from "@react-native-async-storage/async-storage";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { RecipeDraft } from "@/types/recipe";
import { save } from "./recipeRepository";
import { useRecipe } from "./useRecipe";

jest.mock("@react-navigation/native", () => {
  const react = require("react");
  return {
    useFocusEffect: (cb: () => void) => react.useEffect(() => cb(), [cb]),
  };
});
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "uuid-x") }));

const draft = (name: string): RecipeDraft => ({
  name,
  ingredients: [{ id: "i1", name: "flour", grams: 500, isFlour: true }],
  tags: [],
});

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("useRecipe", () => {
  it("gets a recipe by id", async () => {
    const created = await save(draft("Baguette"));

    const { result } = renderHook(() => useRecipe(created.id));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.recipe?.name).toBe("Baguette");
  });

  it("returns null for a missing id", async () => {
    const { result } = renderHook(() => useRecipe("missing"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.recipe).toBeNull();
  });
});
