import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { save } from "@/lib/recipes/recipeRepository";
import type { RecipeDraft } from "@/types/recipe";
import RecipesScreen from "./index";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
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

const draft = (name: string): RecipeDraft => ({
  name,
  ingredients: [{ id: "i1", name: "flour", grams: 500, isFlour: true }],
  tags: [],
});

const renderWithProvider = (ui: React.ReactElement) =>
  render(<LanguageProvider>{ui}</LanguageProvider>);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("RecipesScreen", () => {
  it("shows the empty state when there are no recipes", async () => {
    renderWithProvider(<RecipesScreen />);

    await waitFor(() =>
      expect(screen.getByText("No recipes yet")).toBeTruthy(),
    );
  });

  it("shows a stored recipe", async () => {
    await save(draft("Baguette"));

    renderWithProvider(<RecipesScreen />);

    await waitFor(() => expect(screen.getByText("Baguette")).toBeTruthy());
  });

  it("adds a sample recipe when the FAB is pressed", async () => {
    renderWithProvider(<RecipesScreen />);
    await waitFor(() =>
      expect(screen.getByText("No recipes yet")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("add-recipe-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("recipe-card-uuid-x")).toBeTruthy(),
    );
  });
});
