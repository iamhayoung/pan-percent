import { translate } from "./translate";

describe("translate", () => {
  it("returns the app name per locale", () => {
    expect(translate("en", "appName")).toBe("Pan Percent");
    expect(translate("ja", "appName")).toBe("ぱんパーセント");
    expect(translate("ko", "appName")).toBe("빵 퍼센트");
  });

  it("returns the value for a given key and language", () => {
    expect(translate("en", "tabRecipes")).toBe("Recipes");
    expect(translate("ja", "tabRecipes")).toBe("レシピ");
    expect(translate("ko", "tabRecipes")).toBe("레시피");
  });
});
