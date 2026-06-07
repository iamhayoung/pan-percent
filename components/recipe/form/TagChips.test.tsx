import { fireEvent, render, screen } from "@testing-library/react-native";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { TagChips } from "./TagChips";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));

const renderWithProvider = (ui: React.ReactElement) =>
  render(<LanguageProvider>{ui}</LanguageProvider>);

describe("TagChips", () => {
  it("renders existing tags as chips", () => {
    renderWithProvider(
      <TagChips tags={["lean", "sourdough"]} onChange={() => {}} />,
    );

    expect(screen.getByTestId("tag-lean")).toBeTruthy();
    expect(screen.getByTestId("tag-sourdough")).toBeTruthy();
    expect(screen.getByText("lean")).toBeTruthy();
    expect(screen.getByText("sourdough")).toBeTruthy();
  });

  it("shows an add button by default and reveals an input when pressed", () => {
    renderWithProvider(<TagChips tags={[]} onChange={() => {}} />);

    expect(screen.getByTestId("add-tag")).toBeTruthy();
    expect(screen.queryByTestId("tag-input")).toBeNull();

    fireEvent.press(screen.getByTestId("add-tag"));

    expect(screen.getByTestId("tag-input")).toBeTruthy();
  });

  it("appends a new tag when the input is submitted", () => {
    const onChange = jest.fn();
    renderWithProvider(<TagChips tags={["lean"]} onChange={onChange} />);

    fireEvent.press(screen.getByTestId("add-tag"));
    fireEvent.changeText(screen.getByTestId("tag-input"), "sourdough");
    fireEvent(screen.getByTestId("tag-input"), "submitEditing");

    expect(onChange).toHaveBeenCalledWith(["lean", "sourdough"]);
  });

  it("trims whitespace and ignores empty submissions", () => {
    const onChange = jest.fn();
    renderWithProvider(<TagChips tags={[]} onChange={onChange} />);

    fireEvent.press(screen.getByTestId("add-tag"));
    fireEvent.changeText(screen.getByTestId("tag-input"), "  rye  ");
    fireEvent(screen.getByTestId("tag-input"), "submitEditing");

    expect(onChange).toHaveBeenCalledWith(["rye"]);
    onChange.mockClear();

    fireEvent.press(screen.getByTestId("add-tag"));
    fireEvent.changeText(screen.getByTestId("tag-input"), "   ");
    fireEvent(screen.getByTestId("tag-input"), "submitEditing");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("silently ignores duplicate submissions", () => {
    const onChange = jest.fn();
    renderWithProvider(<TagChips tags={["lean"]} onChange={onChange} />);

    fireEvent.press(screen.getByTestId("add-tag"));
    fireEvent.changeText(screen.getByTestId("tag-input"), "lean");
    fireEvent(screen.getByTestId("tag-input"), "submitEditing");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes a tag when its remove button is pressed", () => {
    const onChange = jest.fn();
    renderWithProvider(
      <TagChips tags={["lean", "sourdough"]} onChange={onChange} />,
    );

    fireEvent.press(screen.getByTestId("remove-tag-lean"));

    expect(onChange).toHaveBeenCalledWith(["sourdough"]);
  });
});
