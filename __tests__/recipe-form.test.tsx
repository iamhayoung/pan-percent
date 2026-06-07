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
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useNavigation: () => ({
    setOptions: jest.fn(),
    dispatch: jest.fn(),
  }),
}));
jest.mock("@react-navigation/native", () => ({
  usePreventRemove: jest.fn(),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));
let mockIdn = 0;
jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => `id-${++mockIdn}`),
}));

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
  mockIdn = 0;
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

  it("keeps the save button disabled until dirty and valid, then saves", async () => {
    renderWithProvider(<RecipeForm initial={null} />);
    const saveBtn = () => screen.getByTestId("save-recipe");

    expect(saveBtn().props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(screen.getByTestId("recipe-name"), "My bread");
    expect(saveBtn().props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(screen.getByTestId("flour-name-id-1"), "Bread flour");
    fireEvent.changeText(screen.getByTestId("total-flour-input"), "500");
    expect(saveBtn().props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(screen.getByTestId("ingredient-name-id-2"), "Water");
    fireEvent.changeText(screen.getByTestId("ingredient-grams-id-2"), "350");

    expect(saveBtn().props.accessibilityState?.disabled).toBe(false);

    fireEvent.press(saveBtn());

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
