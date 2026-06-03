import AsyncStorage from "@react-native-async-storage/async-storage";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { RecipeDraft } from "@/types/recipe";
import { save } from "./recipeRepository";
import { useRecipes } from "./useRecipes";

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

describe("useRecipes", () => {
  it("loads recipes from the repository", async () => {
    await save(draft("Baguette"));

    const { result } = renderHook(() => useRecipes());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.recipes).toHaveLength(1);
    expect(result.current.recipes[0].name).toBe("Baguette");
  });

  it("is empty when nothing is stored", async () => {
    const { result } = renderHook(() => useRecipes());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.recipes).toEqual([]);
  });
});
