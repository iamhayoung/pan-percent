import { fireEvent, render, screen } from "@testing-library/react-native";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Recipe } from "@/types/recipe";
import { RecipeCard } from "./RecipeCard";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));

const recipe: Recipe = {
  id: "r1",
  name: "Baguette",
  ingredients: [],
  tags: ["bread", "crusty"],
  createdAt: 1,
  updatedAt: 1,
};

const renderWithProvider = (ui: React.ReactElement) =>
  render(<LanguageProvider>{ui}</LanguageProvider>);

describe("RecipeCard", () => {
  it("shows the name and tags", () => {
    renderWithProvider(<RecipeCard recipe={recipe} onPress={() => {}} />);

    expect(screen.getByText("Baguette")).toBeTruthy();
    expect(screen.getByText("bread")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    renderWithProvider(<RecipeCard recipe={recipe} onPress={onPress} />);

    fireEvent.press(screen.getByTestId("recipe-card-r1"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
