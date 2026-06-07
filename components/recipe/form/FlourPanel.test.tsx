import { fireEvent, render, screen } from "@testing-library/react-native";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Ingredient } from "@/types/recipe";
import { FlourPanel } from "./FlourPanel";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));

const flour = (id: string, name: string, grams: number): Ingredient => ({
  id,
  name,
  grams,
  isFlour: true,
});
const noop = () => {};
const renderWithProvider = (ui: React.ReactElement) =>
  render(<LanguageProvider>{ui}</LanguageProvider>);

const baseProps = {
  onScaleTotal: noop,
  onFlourGrams: noop,
  onFlourName: noop,
  onAddFlour: noop,
  onRemoveFlour: noop,
};

describe("FlourPanel", () => {
  it("shows the total flour and scales via the stepper", () => {
    const onScaleTotal = jest.fn();
    renderWithProvider(
      <FlourPanel
        {...baseProps}
        flours={[flour("f1", "強力粉", 250)]}
        totalFlour={250}
        onScaleTotal={onScaleTotal}
      />,
    );

    expect(screen.getByDisplayValue("250")).toBeTruthy();

    fireEvent.press(screen.getByTestId("flour-plus"));
    expect(onScaleTotal).toHaveBeenCalledWith(260);

    fireEvent.press(screen.getByTestId("flour-minus"));
    expect(onScaleTotal).toHaveBeenCalledWith(240);

    fireEvent.changeText(screen.getByTestId("total-flour-input"), "1000");
    expect(onScaleTotal).toHaveBeenCalledWith(1000);
  });

  it("calls onAddFlour from the add button", () => {
    const onAddFlour = jest.fn();
    renderWithProvider(
      <FlourPanel
        {...baseProps}
        flours={[flour("f1", "強力粉", 250)]}
        totalFlour={250}
        onAddFlour={onAddFlour}
      />,
    );

    fireEvent.press(screen.getByTestId("add-flour"));
    expect(onAddFlour).toHaveBeenCalledTimes(1);
  });

  it("shows a name field per flour when blended", () => {
    renderWithProvider(
      <FlourPanel
        {...baseProps}
        flours={[flour("f1", "全粒粉", 100), flour("f2", "強力粉", 150)]}
        totalFlour={250}
      />,
    );

    expect(screen.getByTestId("flour-name-f1")).toBeTruthy();
    expect(screen.getByTestId("flour-name-f2")).toBeTruthy();
    expect(screen.getByTestId("flour-grams-f2")).toBeTruthy();
  });

  it("hides the remove button when there is only one flour", () => {
    renderWithProvider(
      <FlourPanel
        {...baseProps}
        flours={[flour("f1", "強力粉", 250)]}
        totalFlour={250}
      />,
    );

    expect(screen.queryByTestId("remove-flour-f1")).toBeNull();
  });

  it("disables the remove button on the first flour even when blended", () => {
    renderWithProvider(
      <FlourPanel
        {...baseProps}
        flours={[flour("f1", "全粒粉", 100), flour("f2", "強力粉", 150)]}
        totalFlour={250}
      />,
    );

    const first = screen.getByTestId("remove-flour-f1");
    expect(first.props.accessibilityState?.disabled).toBe(true);
    const second = screen.getByTestId("remove-flour-f2");
    expect(second.props.accessibilityState?.disabled).toBe(false);
  });

  it("calls onRemoveFlour with the flour id when blended", () => {
    const onRemoveFlour = jest.fn();
    renderWithProvider(
      <FlourPanel
        {...baseProps}
        flours={[flour("f1", "全粒粉", 100), flour("f2", "強力粉", 150)]}
        totalFlour={250}
        onRemoveFlour={onRemoveFlour}
      />,
    );

    fireEvent.press(screen.getByTestId("remove-flour-f2"));
    expect(onRemoveFlour).toHaveBeenCalledWith("f2");
  });
});
