# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pan-percent is a cross-platform recipe management mobile app built with Expo (React Native). The name references bread recipes (パン/pan in Japanese).

**Tech Stack:** React 19.1, React Native 0.81, Expo ~54, TypeScript ~5.9, Expo Router ~6, Biome (linter/formatter)

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
```

## Architecture

### File-Based Routing (Expo Router)

Routes are defined by the file structure in `app/`:

```
app/
├── _layout.tsx           # Root Stack navigator
├── (tabs)/               # Tab group (bottom navigation)
│   ├── _layout.tsx       # Tab navigator config
│   ├── index.tsx         # "My recipes" tab (home screen)
│   └── settings.tsx      # "Settings" tab
├── recipe/
│   └── register.tsx      # Recipe registration screen (modal/push)
└── +not-found.tsx        # 404 fallback
```

- `_layout.tsx` files define navigators (Stack, Tabs)
- `(tabs)/` is a route group that doesn't appear in URL
- Routes outside `(tabs)/` are presented as stack screens

### Component Organization

```
components/
└── recipe/
    └── register/
        └── Thumbnail.tsx   # Feature-scoped components
```

Reusable components go in `components/`. Feature-specific components are nested under feature directories.

### Path Aliases

Use `@/` for imports from the project root:
```typescript
import { Component } from "@/components/Component";
```

## Configuration Notes

- **New Architecture** and **React Compiler** are enabled (experimental features in app.json)
- **Typed Routes** enabled for type-safe navigation
- VSCode is configured to auto-fix on save and organize imports
- Renovate handles dependency updates with automerge for patch/minor versions
