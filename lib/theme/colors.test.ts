import { darkColors, getColors, lightColors } from "./colors";

describe("getColors", () => {
  it("returns light tokens for light scheme", () => {
    expect(getColors("light")).toBe(lightColors);
  });

  it("returns dark tokens for dark scheme", () => {
    expect(getColors("dark")).toBe(darkColors);
  });

  it("exposes the same token keys for both schemes", () => {
    expect(Object.keys(lightColors)).toEqual(Object.keys(darkColors));
  });
});
