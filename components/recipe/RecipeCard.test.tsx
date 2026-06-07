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

  it("shows a one-line preview with flour and top ingredients when available", () => {
    const withIngredients: Recipe = {
      ...recipe,
      ingredients: [
        { id: "flour", name: "Bread flour", grams: 500, isFlour: true },
        { id: "water", name: "Water", grams: 350, isFlour: false },
        { id: "salt", name: "Salt", grams: 10, isFlour: false },
      ],
    };

    renderWithProvider(
      <RecipeCard recipe={withIngredients} onPress={() => {}} />,
    );

    expect(screen.getByTestId("recipe-preview-r1")).toBeTruthy();
    expect(
      screen.getByText("Bread flour 500g · Water 350g · Salt 10g"),
    ).toBeTruthy();
  });

  it("hides the preview line when there is nothing to summarize", () => {
    renderWithProvider(<RecipeCard recipe={recipe} onPress={() => {}} />);

    expect(screen.queryByTestId("recipe-preview-r1")).toBeNull();
  });
});
