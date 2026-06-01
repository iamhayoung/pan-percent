export const translations = {
  en: {
    appName: "Pan Percent",
    tabRecipes: "Recipes",
    tabSettings: "Settings",
  },
  ja: {
    appName: "ぱんパーセント",
    tabRecipes: "レシピ",
    tabSettings: "設定",
  },
  ko: {
    appName: "빵 퍼센트",
    tabRecipes: "레시피",
    tabSettings: "설정",
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof (typeof translations)["en"];
