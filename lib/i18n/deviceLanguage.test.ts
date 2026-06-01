import { resolveLanguage } from "./deviceLanguage";

describe("resolveLanguage", () => {
  it("picks the first supported language code", () => {
    expect(resolveLanguage(["ja", "en"])).toBe("ja");
    expect(resolveLanguage(["ko"])).toBe("ko");
  });

  it("matches case-insensitively and ignores region suffix", () => {
    expect(resolveLanguage(["JA-JP"])).toBe("ja");
    expect(resolveLanguage(["en-US"])).toBe("en");
  });

  it("falls back to en for unsupported or empty input", () => {
    expect(resolveLanguage(["fr", "de"])).toBe("en");
    expect(resolveLanguage([null])).toBe("en");
    expect(resolveLanguage([])).toBe("en");
  });
});
