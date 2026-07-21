import { fireEvent, render, screen } from "@testing-library/react-native";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Ingredient } from "@/types/recipe";
import { IngredientRow } from "./IngredientRow";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));

const water: Ingredient = {
  id: "water",
  name: "Water",
  grams: 175,
  isFlour: false,
};
const noop = () => {};
const renderWithProvider = (ui: React.ReactElement) =>
  render(<LanguageProvider>{ui}</LanguageProvider>);

describe("IngredientRow", () => {
  it("shows the name and calls onName on change", () => {
    const onName = jest.fn();
    renderWithProvider(
      <IngredientRow
        ingredient={water}
        percent={70}
        percentEditable={true}
        removable={true}
        onName={onName}
        onGrams={noop}
        onPercent={noop}
        onRemove={noop}
      />,
    );

    expect(screen.getByDisplayValue("Water")).toBeTruthy();

    fireEvent.changeText(screen.getByTestId("ingredient-name-water"), "Milk");

    expect(onName).toHaveBeenCalledWith("Milk");
  });

  it("calls onGrams with a number", () => {
    const onGrams = jest.fn();
    renderWithProvider(
      <IngredientRow
        ingredient={water}
        percent={70}
        percentEditable={true}
        removable={true}
        onName={noop}
        onGrams={onGrams}
        onPercent={noop}
        onRemove={noop}
      />,
    );

    fireEvent.changeText(screen.getByTestId("ingredient-grams-water"), "200");
    expect(onGrams).toHaveBeenCalledWith(200);
  });

  it("calls onPercent with a number", () => {
    const onPercent = jest.fn();
    renderWithProvider(
      <IngredientRow
        ingredient={water}
        percent={70}
        percentEditable={true}
        removable={true}
        onName={noop}
        onGrams={noop}
        onPercent={onPercent}
        onRemove={noop}
      />,
    );

    fireEvent.changeText(screen.getByTestId("ingredient-percent-water"), "65");
    expect(onPercent).toHaveBeenCalledWith(65);
  });

  it("disables the percent input when percentEditable is false", () => {
    renderWithProvider(
      <IngredientRow
        ingredient={water}
        percent={null}
        percentEditable={false}
        removable={true}
        onName={noop}
        onGrams={noop}
        onPercent={noop}
        onRemove={noop}
      />,
    );

    const input = screen.getByTestId("ingredient-percent-water");
    expect(input.props.editable).toBe(false);
  });

  it("disables the remove button when removable is false", () => {
    renderWithProvider(
      <IngredientRow
        ingredient={water}
        percent={70}
        percentEditable={true}
        removable={false}
        onName={noop}
        onGrams={noop}
        onPercent={noop}
        onRemove={noop}
      />,
    );

    const btn = screen.getByTestId("remove-ingredient-water");
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it("calls onRemove when the remove button is pressed", () => {
    const onRemove = jest.fn();
    renderWithProvider(
      <IngredientRow
        ingredient={water}
        percent={70}
        percentEditable={true}
        removable={true}
        onName={noop}
        onGrams={noop}
        onPercent={noop}
        onRemove={onRemove}
      />,
    );

    fireEvent.press(screen.getByTestId("remove-ingredient-water"));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
