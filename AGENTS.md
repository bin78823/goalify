# Goalify - Agent Instructions

## Project Overview

Goalify is a project management application with Gantt chart functionality. It's a **pnpm monorepo** with four packages:

| Package            | Path                | Description                                                    |
| ------------------ | ------------------- | -------------------------------------------------------------- |
| `@goalify/web`     | `packages/web/`     | React 19 + Vite SPA (main application)                         |
| `@goalify/ui`      | `packages/ui/`      | Shared UI component library (shadcn/ui style, built with tsup) |
| `@goalify/desktop` | `packages/desktop/` | Tauri desktop wrapper around `@goalify/web`                    |
| `@goalify/mobile`  | `packages/mobile/`  | React Native + Expo mobile app                                 |

**Key dependencies:** React 19, TypeScript, Tailwind CSS v4, Zustand, Radix UI, react-router-dom, i18next, lucide-react, date-fns

---

## Build / Lint / Test Commands

### Root-level commands (run from repo root)

```bash
pnpm dev                  # Start web dev server (port 3000)
pnpm dev:web              # Same as above
pnpm dev:desktop          # Start Tauri desktop app (runs web + tauri dev concurrently)
pnpm dev:ios              # Run Expo iOS app (requires Xcode)
pnpm dev:android          # Run Expo Android app (requires Android SDK)
pnpm dev:mobile           # Run both iOS and Android concurrently
pnpm dev:all              # Run web + mobile concurrently
pnpm build                # Build all packages (sequential, via pnpm -r)
pnpm build:web            # Build web package (tsc && vite build)
pnpm build:desktop        # Build Tauri desktop app
pnpm build:ios            # Build iOS release
pnpm build:android        # Build Android release
pnpm lint                 # Lint all packages (pnpm -r lint)
pnpm format               # Format all packages with Prettier
```

### Package-level commands

```bash
# Web package
pnpm --filter @goalify/web dev
pnpm --filter @goalify/web build      # tsc && vite build
pnpm --filter @goalify/web lint       # eslint .
pnpm --filter @goalify/web format     # prettier --write .

# UI package
pnpm --filter @goalify/ui build       # tsup (outputs to dist/)
pnpm --filter @goalify/ui dev         # vite build --watch
pnpm --filter @goalify/ui lint        # eslint .
pnpm --filter @goalify/ui format      # prettier --write .

# Desktop package
pnpm --filter @goalify/desktop tauri dev
pnpm --filter @goalify/desktop tauri build

# Mobile package
pnpm --filter @goalify/mobile start          # Expo dev server
pnpm --filter @goalify/mobile ios            # Run on iOS
pnpm --filter @goalify/mobile android        # Run on Android
pnpm --filter @goalify/mobile web            # Run on web
pnpm --filter @goalify/mobile prebuild       # Generate native projects
pnpm --filter @goalify/mobile lint           # eslint .
pnpm --filter @goalify/mobile typecheck      # tsc --noEmit
```

### Type checking

```bash
pnpm --filter @goalify/web typecheck      # cd packages/web && npx tsc --noEmit
pnpm --filter @goalify/ui typecheck       # cd packages/ui && npx tsc --noEmit
pnpm --filter @goalify/desktop typecheck # cd packages/desktop && npx tsc --noEmit
pnpm --filter @goalify/mobile typecheck   # cd packages/mobile && npx tsc --noEmit
```

### Testing

**No test framework configured.** If adding tests, use Vitest (fits Vite/React stack). Check with user first on preferred framework.

---

## Code Style Guidelines

### Imports

- Use `import type { ... }` for type-only imports
- Path alias `@/*` maps to `./src/*` in web package
- Import shared UI from `@goalify/ui`: `import { Button } from '@goalify/ui'`
- Use `cn()` from `@goalify/ui/lib/utils` for class merging
- Direct lucide-react imports: `import { Check, X } from 'lucide-react'`

### Formatting & TypeScript

- **Prettier** for formatting, no explicit `.prettierrc` (uses defaults)
- Run `pnpm format` before committing; Husky + lint-staged on pre-commit
- Commit messages: **Conventional Commits** (`feat:`, `fix:`, `chore:`, etc.)
- **Strict mode**, Target: ES2022, Module: ESNext, JSX: `react-jsx`
- Explicit `interface` for props; prefer `interface` over `type` for objects

### Components

- **React.FC** for component typing: `const GanttChart: React.FC<Props> = ({...}) => {...}`
- **forwardRef** for UI primitives in `@goalify/ui` (shadcn/ui pattern)
- `.tsx` for components, `.ts` for utilities; default export, barrel files for re-exports

### Naming Conventions

- **Files:** PascalCase components, camelCase utilities
- **Components/Hooks/Interfaces:** PascalCase/camelCase with `use` prefix
- **Constants:** UPPER_SNAKE_CASE (`HOME_TAB`, `TASK_COLORS`)
- **Zustand stores:** `useXxxStore` pattern

### State Management (Zustand)

- `create<T>()()` pattern with explicit state interface
- Persist middleware with `partialize` for selective persistence
- Store files in `src/stores/`, IDs: `Date.now()` + `Math.random().toString(36)`

### Styling & i18n

- **Tailwind CSS v4** with CSS custom properties (`--primary`, `--background`)
- `cn()` for class merging (clsx + tailwind-merge), **cva** for variants
- i18next + `useTranslation()`, keys: `t('gantt.week')`, files in `src/locales/`

### Error Handling

- Handle errors locally (no centralized boundary)
- Guard clauses, optional chaining (`?.`), nullish coalescing (`??`)
- Zustand actions return values for navigation decisions

### Project Structure

```
packages/
  web/src/
    components/     # Feature components
    contexts/       # React contexts + Zustand stores
    hooks/          # Custom hooks
    pages/          # Route-level page components
    stores/         # Zustand stores
    types/          # TypeScript type definitions
    locales/        # i18n translation files
  ui/src/
    components/     # Radix-based UI primitives
    lib/            # Shared utilities (cn, etc.)
    index.ts        # Barrel exports
  mobile/           # Expo React Native app
  desktop/          # Tauri desktop wrapper
```

### Git Workflow

- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, etc.
- Husky pre-commit hooks run lint-staged
- Standard branch naming: `feature/`, `fix/`, etc.

### Key Patterns

- **Gantt chart:** Context provider wraps app, Zustand stores manage state, components consume via hooks
- **Tab system:** Zustand-persisted tab state synced with project lifecycle
- **UI primitives:** shadcn/ui pattern — Radix UI + CVA + Tailwind + `cn()`
