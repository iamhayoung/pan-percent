import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text, TouchableOpacity } from "react-native";
import { LanguageProvider, useT } from "./LanguageProvider";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));

function Probe() {
  const { t, setLanguage } = useT();
  return (
    <TouchableOpacity onPress={() => setLanguage("ja")}>
      <Text>{t("appName")}</Text>
    </TouchableOpacity>
  );
}

describe("LanguageProvider", () => {
  it("provides translations based on device language", () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByText("Pan Percent")).toBeTruthy();
  });

  it("switches language via setLanguage", () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    fireEvent.press(screen.getByText("Pan Percent"));
    expect(screen.getByText("ぱんパーセント")).toBeTruthy();
  });
});
