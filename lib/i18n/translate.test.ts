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

  it("has the recipe screen keys in every language", () => {
    expect(translate("ja", "recipesEmpty")).toBe("レシピがありません");
    expect(translate("ko", "delete")).toBe("삭제");
    expect(translate("en", "targetFlourGrams")).toBe("Target flour (g)");
  });

  it("has the recipe form keys in every language", () => {
    expect(translate("ja", "targetAmount")).toBe("作りたい量");
    expect(translate("ko", "save")).toBe("저장");
    expect(translate("en", "addFlour")).toBe("Add flour");
  });
});
