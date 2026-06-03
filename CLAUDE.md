# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pan-percent is a cross-platform recipe management mobile app built with Expo (React Native). The name references bread recipes (パン/pan in Japanese).

**Tech Stack:** React 19.1, React Native 0.81, Expo ~54, TypeScript ~5.9, Expo Router ~6, Biome (linter/formatter), jest-expo + @testing-library/react-native (tests), expo-localization (i18n)

## Development Commands

```bash
npm install          # Install dependencies
npx expo start       # Start development server (press i for iOS, a for Android, w for web)
npx expo start --ios # Start directly on iOS simulator
npx expo start --android # Start directly on Android emulator
npx expo start --web # Start directly in web browser
npm run lint         # Run Biome linter (biome check .)
npm run lint:fix     # Auto-fix lint issues (biome check --write .)
npm run format       # Format code (biome format --write .)
npm test             # Run tests (jest via jest-expo preset)
npm run test:watch   # Run tests in watch mode
```

## Architecture

### File-Based Routing (Expo Router)

Routes are defined by the file structure in `app/`:

```
app/
├── _layout.tsx           # Root Stack (wrapped in LanguageProvider)
├── (tabs)/               # Tab group (recipes / settings)
│   ├── _layout.tsx
│   ├── index.tsx         # Recipe list
│   └── settings.tsx      # Settings
├── recipe/
│   ├── new.tsx           # Create
│   ├── [id].tsx          # Detail (scaling)
│   └── edit/[id].tsx     # Edit
└── +not-found.tsx        # 404 fallback
```

- `_layout.tsx` files define navigators (Stack, Tabs)
- `(tabs)/` is a route group that doesn't appear in URL
- Routes outside `(tabs)/` are presented as stack screens

### Component Organization

```
components/
└── recipe/
    └── new/
        └── Thumbnail.tsx   # Feature-scoped components
```

Reusable components go in `components/`. Feature-specific components are nested under feature directories.

Logic lives in `lib/` as pure functions, with domain types in `types/`:

```
lib/
├── recipes/   # repository layer (AsyncStorage CRUD)
├── bakers/    # baker's percentage calculation (pure functions)
├── i18n/      # typed dictionary & language hook (useT)
└── theme/     # light/dark tokens & useTheme

types/         # domain types (Recipe, etc.)
```

### Path Aliases

Use `@/` for imports from the project root:
```typescript
import { Component } from "@/components/Component";
```

## Testing

- TDD with jest-expo + @testing-library/react-native; run `npm test`
- Co-locate tests next to source (`foo.ts` + `foo.test.ts`) — the default for `lib/`, `components/`, etc.
- **Exception — route screen tests:** do NOT co-locate tests inside `app/`. Expo Router bundles every file under `app/` via `require.context` (it excludes only `+api`/`+html`/`+middleware`, not `.test.`), so a co-located test pulls @testing-library into the app bundle and breaks it — even under `app/__tests__/` (still inside the scanned root). Put screen/route tests in the top-level `__tests__/` directory instead, importing screens via `@/app/...`.

## Branch Strategy

- Branch off `develop` per unit of work (feature branch)
- feature → review → merge into `develop`
- Release: develop → stage → main (tag `vX.Y.Z` on `main`)

## i18n / Theme

- i18n: typed dictionary (en/ja/ko) + `expo-localization` device following. Resolve via `useT()`, fall back to en
- Theme: `useTheme()` follows `useColorScheme()` and returns light/dark tokens

## Supported Platforms

- iOS 16 range / Android 11–12 range (within Expo 54 support)
- iOS 26+ supports Liquid Glass (branch via `isLiquidGlassAvailable()`, flat below)
- Account for all screen sizes incl. foldables (safe-area, avoid fixed px widths, 1–2 column responsive)

## UI/UX Guidelines

- Calm warm palette (neutral + one accent). No cool colors (indigo/violet/purple)
- Card radius 12px (no 8px; 20px for large surfaces)
- Filled icons (no outline). No gradients or excessive effects
- Minimal layouts keeping only essentials. Meet WCAG AA in both modes

## Configuration Notes

- **New Architecture** and **React Compiler** are enabled (experimental features in app.json)
- **Typed Routes** enabled for type-safe navigation
- VSCode is configured to auto-fix on save and organize imports
- Renovate handles dependency updates with automerge for patch/minor versions
