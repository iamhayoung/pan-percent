import { render, screen } from "@testing-library/react-native";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { PhotoPicker } from "./PhotoPicker";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));
jest.mock("expo-image-picker", () => ({
  MediaTypeOptions: { Images: "Images" },
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const renderWithProvider = (ui: React.ReactElement) =>
  render(<LanguageProvider>{ui}</LanguageProvider>);

describe("PhotoPicker", () => {
  it("shows a camera placeholder when no photo is set", () => {
    renderWithProvider(
      <PhotoPicker photoUri={undefined} onChange={() => {}} />,
    );

    expect(screen.getByTestId("photo-picker")).toBeTruthy();
    expect(screen.queryByTestId("photo-picker-image")).toBeNull();
    expect(screen.getByText("Add photo")).toBeTruthy();
  });

  it("shows the image when a photoUri is provided", () => {
    renderWithProvider(
      <PhotoPicker photoUri="file:///tmp/photo.jpg" onChange={() => {}} />,
    );

    expect(screen.getByTestId("photo-picker-image")).toBeTruthy();
    expect(screen.queryByText("Add photo")).toBeNull();
  });
});
