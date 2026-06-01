import { fireEvent, render, screen } from "@testing-library/react-native";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Ingredient } from "@/types/recipe";
import { ScaleControl } from "./ScaleControl";

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

describe("ScaleControl", () => {
  it("recomputes weights when the target flour changes", () => {
    renderWithProvider(
      <ScaleControl
        ingredients={[ing("flour", 500, true), ing("water", 350, false)]}
      />,
    );

    fireEvent.changeText(screen.getByDisplayValue("500"), "1000");

    expect(screen.getByText("700g")).toBeTruthy();
  });

  it("shows an unavailable message when there is no flour", () => {
    renderWithProvider(
      <ScaleControl ingredients={[ing("water", 350, false)]} />,
    );

    expect(screen.getByText("Add flour to scale")).toBeTruthy();
  });
});
