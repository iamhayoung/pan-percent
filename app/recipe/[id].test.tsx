import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Alert } from "react-native";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { list, save } from "@/lib/recipes/recipeRepository";
import type { RecipeDraft } from "@/types/recipe";
import RecipeDetailScreen from "./[id]";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "uuid-x" }),
  useRouter: () => ({ back: mockBack }),
}));
jest.mock("@react-navigation/native", () => {
  const react = require("react");
  return {
    useFocusEffect: (cb: () => void) => react.useEffect(() => cb(), [cb]),
  };
});
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "uuid-x") }));

const draft: RecipeDraft = {
  name: "Baguette",
  ingredients: [
    { id: "flour", name: "Flour", grams: 500, isFlour: true },
    { id: "water", name: "Water", grams: 350, isFlour: false },
  ],
  tags: [],
};

const renderWithProvider = (ui: React.ReactElement) =>
  render(<LanguageProvider>{ui}</LanguageProvider>);

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe("RecipeDetailScreen", () => {
  it("shows the recipe and its baker percentages", async () => {
    await save(draft);

    renderWithProvider(<RecipeDetailScreen />);

    await waitFor(() => expect(screen.getByText("Baguette")).toBeTruthy());
    expect(screen.getByText("100%")).toBeTruthy();
    expect(screen.getByText("70%")).toBeTruthy();
  });

  it("deletes after confirmation and navigates back", async () => {
    await save(draft);
    jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        const confirm = buttons?.find((b) => b.style === "destructive");
        confirm?.onPress?.();
      });

    renderWithProvider(<RecipeDetailScreen />);
    await waitFor(() => expect(screen.getByText("Baguette")).toBeTruthy());

    fireEvent.press(screen.getByText("Delete"));

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(await list()).toEqual([]);
  });
});
