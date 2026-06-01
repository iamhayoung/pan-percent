# feature/foundation 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pan Percent アプリの土台（雛形整理・依存棚卸し・テスト基盤・テーマ light/dark・i18n 土台・CLAUDE.md 更新）を整え、以降の feature ブランチが乗る基盤を作る。

**Architecture:** ロジックは `lib/` の純粋関数に寄せ、UI はそれを参照する。テーマは `useColorScheme()` 追従の `useTheme()` フック、i18n は型付き辞書 + `LanguageProvider`/`useT()`。永続化（言語の保存）はこのブランチには含めず、recipe-storage / settings-i18n ブランチで追加する。

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19.1, TypeScript 5.9, Expo Router 6, Biome, jest-expo + @testing-library/react-native, expo-localization。

参照 spec: `docs/specs/pan-percent-app-design.md`

---

## File Structure

作成/変更するファイルと責務：

- `lib/i18n/translations.ts` — 型付き辞書（en/ja/ko）と `Language`/`TranslationKey` 型
- `lib/i18n/translate.ts` — `translate(language, key)` 純粋関数
- `lib/i18n/deviceLanguage.ts` — `resolveLanguage()` 純粋関数 + `getDeviceLanguage()`（expo-localization）
- `lib/i18n/LanguageProvider.tsx` — Context Provider と `useT()` フック
- `lib/theme/colors.ts` — light/dark カラートークンと `ColorTokens` 型、`getColors()` 純粋関数
- `lib/theme/tokens.ts` — spacing / radius / fontSize トークン
- `lib/theme/useTheme.ts` — `useTheme()` フック（useColorScheme 追従）
- `app/_layout.tsx`（変更）— `LanguageProvider` でラップ
- `app/index.tsx`（変更）— 配線確認用の最小ホーム（後続ブランチで本実装に置換）
- `biome.json`（変更）— `lib/**`, `types/**` を includes に追加
- `package.json`（変更）— 未使用依存削除・テスト依存追加・`jest` 設定・`test` script・不要 script 削除
- `CLAUDE.md`（変更）— 実態に合わせて書き換え
- `app-example/`（削除）

各テストはソースに併置（`*.test.ts` / `*.test.tsx`）。

---

## Task 1: 雛形整理と依存の棚卸し

**Files:**
- Delete: `app-example/`（ディレクトリ全体）
- Modify: `package.json`

- [ ] **Step 1: 雛形ディレクトリを削除**

```bash
git rm -r app-example
```

- [ ] **Step 2: 未使用依存を削除**

未使用の機能ライブラリを外す（`expo-image` は写真表示で使うため残す、`expo-font` は `@expo/vector-icons` が依存するため残す）。

```bash
npm uninstall expo-haptics expo-symbols expo-web-browser
```

- [ ] **Step 3: 存在しない reset-project スクリプトを削除**

`package.json` の `scripts` から次の行を削除する（参照先 `./scripts/reset-project.js` は存在しない）：

```json
"reset-project": "node ./scripts/reset-project.js",
```

- [ ] **Step 4: 依存バージョンを Expo 54 互換の最新へ揃える**

Run: `npx expo install --fix`
Expected: いくつかのパッケージが SDK54 互換版に更新される。エラーなく完了する。

- [ ] **Step 5: 既存の lint と型チェックが通ることを確認**

Run: `npm run lint && npx tsc --noEmit`
Expected: どちらもエラー無しで完了（app-example 削除後、参照切れが無いこと）。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove example scaffold and unused dependencies"
```

---

## Task 2: テスト基盤の構築

**Files:**
- Modify: `package.json`
- Create: `lib/__smoke__/smoke.test.ts`

- [ ] **Step 1: テスト依存をインストール**

```bash
npm install --save-dev jest-expo jest @types/jest @testing-library/react-native react-test-renderer@19.1.0
```

- [ ] **Step 2: `package.json` に jest 設定と test script を追加**

`scripts` に追加：

```json
"test": "jest",
"test:watch": "jest --watch"
```

`package.json` のトップレベルに `jest` キーを追加：

```json
"jest": {
  "preset": "jest-expo"
}
```

- [ ] **Step 3: スモークテストを書く（基盤が動くことの確認）**

Create `lib/__smoke__/smoke.test.ts`:

```ts
describe("test infrastructure", () => {
  it("runs jest", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: テストを実行して通ることを確認**

Run: `npm test`
Expected: PASS（1 test passed）。jest-expo preset がロードされ、エラー無く完了する。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: set up jest-expo test infrastructure"
```

---

## Task 3: i18n 辞書と translate 純粋関数（TDD）

**Files:**
- Create: `lib/i18n/translations.ts`
- Create: `lib/i18n/translate.ts`
- Test: `lib/i18n/translate.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

Create `lib/i18n/translate.test.ts`:

```ts
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
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- translate`
Expected: FAIL（`Cannot find module './translate'`）。

- [ ] **Step 3: 辞書を実装**

Create `lib/i18n/translations.ts`:

```ts
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
```

- [ ] **Step 4: translate を実装**

Create `lib/i18n/translate.ts`:

```ts
import { type Language, type TranslationKey, translations } from "./translations";

export function translate(language: Language, key: TranslationKey): string {
  return translations[language][key];
}
```

- [ ] **Step 5: テストが通ることを確認**

Run: `npm test -- translate`
Expected: PASS（2 tests passed）。

- [ ] **Step 6: Commit**

```bash
git add lib/i18n/translations.ts lib/i18n/translate.ts lib/i18n/translate.test.ts
git commit -m "feat: add typed i18n dictionary and translate function"
```

---

## Task 4: 端末言語の解決（TDD）

**Files:**
- Create: `lib/i18n/deviceLanguage.ts`
- Test: `lib/i18n/deviceLanguage.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`resolveLanguage` は端末のロケールコード配列から対応言語を決める純粋関数。先頭から最初に一致した対応言語を返し、無ければ en にフォールバックする。

Create `lib/i18n/deviceLanguage.test.ts`:

```ts
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
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- deviceLanguage`
Expected: FAIL（`Cannot find module './deviceLanguage'`）。

- [ ] **Step 3: 実装**

Create `lib/i18n/deviceLanguage.ts`:

```ts
import { getLocales } from "expo-localization";
import { type Language, translations } from "./translations";

const SUPPORTED = Object.keys(translations) as Language[];
const FALLBACK: Language = "en";

export function resolveLanguage(languageCodes: (string | null)[]): Language {
  for (const code of languageCodes) {
    const lang = code?.slice(0, 2).toLowerCase();
    if (lang && (SUPPORTED as string[]).includes(lang)) {
      return lang as Language;
    }
  }
  return FALLBACK;
}

export function getDeviceLanguage(): Language {
  return resolveLanguage(getLocales().map((locale) => locale.languageCode));
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- deviceLanguage`
Expected: PASS（3 tests passed）。

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/deviceLanguage.ts lib/i18n/deviceLanguage.test.ts
git commit -m "feat: resolve device language with en fallback"
```

---

## Task 5: LanguageProvider と useT（TDD）

**Files:**
- Create: `lib/i18n/LanguageProvider.tsx`
- Test: `lib/i18n/LanguageProvider.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

`expo-localization` をモックし、Provider 配下で `useT().t` が辞書を引けること、`setLanguage` で表示が切り替わることを検証する。

Create `lib/i18n/LanguageProvider.test.tsx`:

```tsx
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
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- LanguageProvider`
Expected: FAIL（`Cannot find module './LanguageProvider'`）。

- [ ] **Step 3: 実装**

Create `lib/i18n/LanguageProvider.tsx`:

```tsx
import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { getDeviceLanguage } from "./deviceLanguage";
import { translate } from "./translate";
import type { Language, TranslationKey } from "./translations";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getDeviceLanguage);
  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key) => translate(language, key),
    }),
    [language],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useT must be used within a LanguageProvider");
  }
  return context;
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- LanguageProvider`
Expected: PASS（2 tests passed）。

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/LanguageProvider.tsx lib/i18n/LanguageProvider.test.tsx
git commit -m "feat: add LanguageProvider context and useT hook"
```

---

## Task 6: テーマトークンと useTheme（TDD）

**Files:**
- Create: `lib/theme/colors.ts`
- Create: `lib/theme/tokens.ts`
- Create: `lib/theme/useTheme.ts`
- Test: `lib/theme/colors.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`getColors(scheme)` は scheme に応じた純粋なトークン取得関数。

Create `lib/theme/colors.test.ts`:

```ts
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
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- colors`
Expected: FAIL（`Cannot find module './colors'`）。

- [ ] **Step 3: カラートークンを実装**

Create `lib/theme/colors.ts`（値は v1 のたたき台。実機で WCAG AA 以上を再検証する）:

```ts
export const lightColors = {
  background: "#FBF7F0",
  surface: "#FFFFFF",
  textPrimary: "#2B2420",
  textSecondary: "#6B5E54",
  accent: "#C0612F",
  accentText: "#FFFFFF",
  border: "#E7DECF",
} as const;

export const darkColors = {
  background: "#1A1714",
  surface: "#241F1B",
  textPrimary: "#F2EADF",
  textSecondary: "#B8A99B",
  accent: "#E08A52",
  accentText: "#1A1714",
  border: "#3A322B",
} as const;

export type ColorScheme = "light" | "dark";
export type ColorTokens = typeof lightColors;

export function getColors(scheme: ColorScheme): ColorTokens {
  return scheme === "dark" ? darkColors : lightColors;
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- colors`
Expected: PASS（3 tests passed）。

- [ ] **Step 5: spacing/radius/fontSize トークンを実装**

Create `lib/theme/tokens.ts`:

```ts
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { card: 12, large: 20, pill: 999 } as const;
export const fontSize = { sm: 13, md: 15, lg: 18, xl: 24, xxl: 32 } as const;
```

- [ ] **Step 6: useTheme フックを実装**

Create `lib/theme/useTheme.ts`:

```ts
import { useColorScheme } from "react-native";
import { type ColorScheme, type ColorTokens, getColors } from "./colors";
import { fontSize, radius, spacing } from "./tokens";

export type Theme = {
  scheme: ColorScheme;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
};

export function useTheme(): Theme {
  const scheme: ColorScheme = useColorScheme() === "dark" ? "dark" : "light";
  return { scheme, colors: getColors(scheme), spacing, radius, fontSize };
}
```

- [ ] **Step 7: 型チェックとテストを実行**

Run: `npx tsc --noEmit && npm test -- colors`
Expected: 型エラー無し、テスト PASS。

- [ ] **Step 8: Commit**

```bash
git add lib/theme/
git commit -m "feat: add light/dark theme tokens and useTheme hook"
```

---

## Task 7: ルート配線・最小ホーム・biome includes

**Files:**
- Modify: `app/_layout.tsx`
- Modify: `app/index.tsx`
- Modify: `biome.json`

- [ ] **Step 1: biome の対象に lib/types を追加**

`biome.json` の `files.includes` 配列に次の2要素を追加：

```json
"lib/**",
"types/**",
```

追加後の `includes` は次の通り：

```json
"includes": [
  "app/**",
  "components/**",
  "constants/**",
  "hooks/**",
  "lib/**",
  "types/**",
  "scripts/**",
  "*.json",
  "*.ts"
]
```

- [ ] **Step 2: ルートレイアウトを LanguageProvider でラップ**

Replace `app/_layout.tsx` with:

```tsx
import { Stack } from "expo-router";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

export default function RootLayout() {
  return (
    <LanguageProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </LanguageProvider>
  );
}
```

- [ ] **Step 3: 最小ホーム画面で配線を確認**

Replace `app/index.tsx` with（テーマと i18n が配線されていることを示す暫定画面。後続ブランチでレシピ一覧に置換する）:

```tsx
import { Text, View } from "react-native";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useTheme } from "@/lib/theme/useTheme";

export default function Index() {
  const { t } = useT();
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.colors.background,
      }}
    >
      <Text style={{ color: theme.colors.textPrimary, fontSize: theme.fontSize.xl }}>
        {t("appName")}
      </Text>
    </View>
  );
}
```

- [ ] **Step 4: lint・型チェック・テストを実行**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: lint エラー無し、型エラー無し、全テスト PASS。

- [ ] **Step 5: 実機/シミュレータで起動確認（任意・手動）**

Run: `npx expo start`
Expected: 起動し、画面中央にロケールに応じたアプリ名（端末が日本語なら「ぱんパーセント」）が表示される。

- [ ] **Step 6: Commit**

```bash
git add app/_layout.tsx app/index.tsx biome.json
git commit -m "feat: wire LanguageProvider and theme into app root"
```

---

## Task 8: CLAUDE.md を実態に合わせて更新

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Architecture セクションを実態へ更新**

`CLAUDE.md` の「## Architecture」配下の File-Based Routing のツリーを、本プロジェクトの構成（spec 準拠）に置き換える。古い `recipe/register.tsx` 等の記述を削除し、次のツリーに差し替える：

```
app/
├── _layout.tsx           # Root Stack (LanguageProvider でラップ)
├── (tabs)/               # Tab group (レシピ / 設定)
│   ├── _layout.tsx
│   ├── index.tsx         # レシピ一覧
│   └── settings.tsx      # 設定
├── recipe/
│   ├── new.tsx           # 新規作成
│   ├── [id].tsx          # 詳細（スケール計算）
│   └── edit/[id].tsx     # 編集
└── +not-found.tsx
```

- [ ] **Step 2: Component/lib 構成の説明を更新**

「### Component Organization」配下に、`lib/`（`recipes/`・`bakers/`・`i18n/`・`theme/`）と `types/` の責務を追記する：

```
lib/
├── recipes/   # リポジトリ層（AsyncStorage CRUD）
├── bakers/    # ベーカーズパーセント計算（純粋関数）
├── i18n/      # 型付き辞書・言語フック（useT）
└── theme/     # light/dark トークン・useTheme

types/         # ドメイン型（Recipe 等）
```

- [ ] **Step 3: 新セクションを追記**

`CLAUDE.md` 末尾の「## Configuration Notes」の前に、次のセクションを追加する：

```markdown
## Branch Strategy

- develop から作業スコープ単位で feature ブランチを切る
- feature → レビュー → develop へマージ
- リリース: develop → stage → main（main で `vX.Y.Z` の git tag を打つ）

## i18n / Theme

- i18n: 型付き辞書（en/ja/ko）+ `expo-localization` 端末追従。`useT()` で参照、en フォールバック
- Theme: `useTheme()` が `useColorScheme()` に追従し light/dark トークンを返す

## Supported Platforms

- iOS 16 系目安 / Android 11・12 目安（Expo 54 サポート範囲内）
- iOS 26+ は Liquid Glass 対応（`isLiquidGlassAvailable()` で分岐、未満はフラット）
- フォルダブル含む各画面サイズに配慮（safe-area、固定px幅を避ける、1〜2カラム可変）

## UI/UX Guidelines

- 落ち着いた暖色（ニュートラル + アクセント1色）。indigo/violet/purple 等クールカラー禁止
- カード角丸 12px（8px 禁止、大面は 20px）
- filled アイコン（outline 禁止）。グラデーション・過度な効果排除
- 本質だけ残す単純なレイアウト。WCAG AA 以上を両モードで担保
```

- [ ] **Step 4: 整合性を目視確認**

Read `CLAUDE.md` 全体を読み、古い記述（存在しないルート・register 画面等）が残っていないこと、追記が矛盾しないことを確認する。

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md to match Pan Percent architecture"
```

---

## 完了条件

- `npm run lint`・`npx tsc --noEmit`・`npm test` がすべて成功
- `app-example/` が削除され、未使用依存が外れている
- i18n（辞書・translate・端末言語解決・Provider/useT）が揃いテスト済み
- テーマ（light/dark トークン・useTheme）が揃いテスト済み
- ルートに Provider が配線され、最小ホームでアプリ名がロケール表示される
- CLAUDE.md が実態に一致

このブランチ完了後、`feature/recipe-storage`（型・計算純粋関数・リポジトリ層）のプランへ進む。
