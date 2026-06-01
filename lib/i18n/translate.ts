import {
  type Language,
  type TranslationKey,
  translations,
} from "./translations";

export function translate(language: Language, key: TranslationKey): string {
  return translations[language][key];
}
