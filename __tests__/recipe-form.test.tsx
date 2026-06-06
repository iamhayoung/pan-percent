import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Alert } from "react-native";
import { RecipeForm } from "@/components/recipe/RecipeForm";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { list, save } from "@/lib/recipes/recipeRepository";
import type { Recipe } from "@/types/recipe";

const mockBack = jest.fn();
const mockAddListener = jest.fn(() => jest.fn());
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useNavigation: () => ({
    addListener: mockAddListener,
    setOptions: jest.fn(),
    dispatch: jest.fn(),
  }),
}));
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "uuid-new") }));

const existing: Recipe = {
  id: "r1",
  name: "Baguette",
  ingredients: [
    { id: "flour", name: "Bread flour", grams: 500, isFlour: true },
    { id: "water", name: "Water", grams: 350, isFlour: false },
  ],
  tags: [],
  createdAt: 1,
  updatedAt: 1,
};

const renderWithProvider = (ui: React.ReactElement) =>
  render(<LanguageProvider>{ui}</LanguageProvider>);

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe("RecipeForm", () => {
  it("renders an empty form for a new recipe", () => {
    renderWithProvider(<RecipeForm initial={null} />);

    expect(screen.getByTestId("recipe-name")).toBeTruthy();
    expect(screen.getByTestId("total-flour-input")).toBeTruthy();
    expect(screen.getByTestId("add-ingredient")).toBeTruthy();
  });

  it("populates fields from an existing recipe", () => {
    renderWithProvider(<RecipeForm initial={existing} />);

    expect(screen.getByDisplayValue("Baguette")).toBeTruthy();
    expect(screen.getByDisplayValue("Water")).toBeTruthy();
  });

  it("shows the save button only after a change, and saves", async () => {
    renderWithProvider(<RecipeForm initial={null} />);
    expect(screen.queryByTestId("save-recipe")).toBeNull();

    fireEvent.changeText(screen.getByTestId("recipe-name"), "My bread");
    expect(screen.getByTestId("save-recipe")).toBeTruthy();

    fireEvent.press(screen.getByTestId("save-recipe"));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    const saved = await list();
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe("My bread");
  });

  it("deletes an existing recipe after confirmation", async () => {
    await save({
      id: "r1",
      name: "Baguette",
      ingredients: existing.ingredients,
      tags: [],
    });
    jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.style === "destructive")?.onPress?.();
    });

    renderWithProvider(<RecipeForm initial={existing} />);
    fireEvent.press(screen.getByTestId("delete-recipe"));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(await list()).toEqual([]);
  });
});
