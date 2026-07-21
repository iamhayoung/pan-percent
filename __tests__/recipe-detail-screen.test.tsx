import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Alert } from "react-native";
import RecipeDetailScreen from "@/app/recipe/[id]";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { list, save } from "@/lib/recipes/recipeRepository";
import type { RecipeDraft } from "@/types/recipe";

const mockBack = jest.fn();
const mockAddListener = jest.fn(() => () => {});
const mockDispatch = jest.fn();
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: "uuid-x" }),
  useRouter: () => ({ back: mockBack }),
  useNavigation: () => ({
    addListener: mockAddListener,
    dispatch: mockDispatch,
  }),
}));
jest.mock("@react-navigation/native", () => {
  const react = require("react");
  return {
    useFocusEffect: (cb: () => void) => react.useEffect(() => cb(), [cb]),
    usePreventRemove: jest.fn(),
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
  it("renders the recipe inside the editable form", async () => {
    await save(draft);

    renderWithProvider(<RecipeDetailScreen />);

    await waitFor(() =>
      expect(screen.getByDisplayValue("Baguette")).toBeTruthy(),
    );
    expect(screen.getByDisplayValue("Water")).toBeTruthy();
    expect(screen.getByDisplayValue("350")).toBeTruthy();
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
    await waitFor(() =>
      expect(screen.getByDisplayValue("Baguette")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("delete-recipe"));

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(await list()).toEqual([]);
  });
});
