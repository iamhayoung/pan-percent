import { render, screen } from "@testing-library/react-native";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Ingredient } from "@/types/recipe";
import { BakerPercentTable } from "./BakerPercentTable";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));

const ing = (id: string, grams: number, isFlour: boolean): Ingredient => ({
  id,
  name: id,
  grams,
  isFlour,
});

const renderWithProvider = (ui: React.ReactElement) =>
  render(<LanguageProvider>{ui}</LanguageProvider>);

describe("BakerPercentTable", () => {
  it("shows each ingredient's ratio relative to total flour", () => {
    renderWithProvider(
      <BakerPercentTable
        ingredients={[ing("flour", 500, true), ing("water", 350, false)]}
      />,
    );

    expect(screen.getByText("flour")).toBeTruthy();
    expect(screen.getByText("100%")).toBeTruthy();
    expect(screen.getByText("70%")).toBeTruthy();
  });

  it("shows an em dash when there is no flour", () => {
    renderWithProvider(
      <BakerPercentTable ingredients={[ing("water", 350, false)]} />,
    );

    expect(screen.getByText("—")).toBeTruthy();
  });
});
