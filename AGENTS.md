# Goalify - Agent Instructions

## Project Overview

Goalify is a project management application with Gantt chart functionality. It's a **pnpm monorepo** with three packages:

| Package            | Path                | Description                                                    |
| ------------------ | ------------------- | -------------------------------------------------------------- |
| `@goalify/web`     | `packages/web/`     | React 19 + Vite SPA (main application)                         |
| `@goalify/ui`      | `packages/ui/`      | Shared UI component library (shadcn/ui style, built with tsup) |
| `@goalify/desktop` | `packages/desktop/` | Tauri desktop wrapper around `@goalify/web`                    |

**Key dependencies:** React 19, TypeScript, Tailwind CSS v4, Zustand, Radix UI, react-router-dom, i18next, lucide-react, date-fns

---

## Build / Lint / Test Commands

### Root-level commands (run from repo root)

```bash
pnpm dev                  # Start web dev server (port 3000)
pnpm dev:web              # Same as above
pnpm dev:desktop          # Start Tauri desktop app (runs web + tauri dev concurrently)
pnpm build                # Build all packages (sequential, via pnpm -r)
pnpm build:web            # Build web package only (tsc && vite build)
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
```

### Type checking

```bash
cd packages/web && npx tsc --noEmit
cd packages/ui && npx tsc --noEmit
cd packages/desktop && npx tsc --noEmit
```

### Testing

**No test framework is currently configured.** If adding tests, check with the user first on preferred framework (Vitest is a natural fit given Vite usage).

---

## Code Style Guidelines

### Imports

- Use `import type { ... }` for type-only imports
- Path alias `@/*` maps to `./src/*` in web package
- In `@goalify/ui`, import shared utils from `../lib/utils` (provides `cn()` for class merging)
- Import from `@goalify/ui` for shared components in web: `import { Button } from '@goalify/ui'`
- Use direct imports for lucide-react icons: `import { Check, X } from 'lucide-react'`

### Formatting

- **Prettier** is used for formatting (root devDependency)
- No explicit `.prettierrc` — uses Prettier defaults
- Run `pnpm format` before committing
- Husky + lint-staged are configured for pre-commit hooks
- Commit messages follow **Conventional Commits** (`@commitlint/config-conventional`)

### TypeScript

- **Strict mode** enabled across all packages
- Target: ES2022, Module: ESNext, Module resolution: bundler
- JSX: `react-jsx` (automatic runtime, no `import React` needed in most files)
- Use explicit types for component props via `interface`
- Prefer `interface` over `type` for object shapes
- Use `Omit<>`, `Partial<>`, `Pick<>` utility types for derived types

### Components

- **React.FC** is used for component typing (e.g., `const GanttChart: React.FC<Props> = ({...}) => {`)
- Use **forwardRef** for UI primitives in `@goalify/ui` (shadcn/ui pattern)
- Component files use `.tsx` extension, utility/type files use `.ts`
- One component per file, default export for components
- Index barrel files used for re-exporting (e.g., `components/TabBar/index.ts`)

### Naming Conventions

- **Files:** PascalCase for components (`GanttChart.tsx`), camelCase for utilities (`utils.ts`), PascalCase for stores (`TabStore.ts`)
- **Components:** PascalCase (`GanttChart`, `TabItem`, `CreateProjectDialog`)
- **Hooks:** camelCase with `use` prefix (`useTabNavigation`, `useGanttStore`)
- **Interfaces:** PascalCase (`Task`, `Project`, `GanttState`, `TabBarProps`)
- **Constants:** UPPER_SNAKE_CASE for true constants (`HOME_TAB`, `TASK_COLORS`), camelCase for module-level config
- **Zustand stores:** `useXxxStore` naming (e.g., `useTabStore`, `useGanttStore`)

### State Management (Zustand)

- Use `create<T>()()` pattern with explicit state interface
- Persist middleware with `partialize` for selective persistence
- Store files in `src/stores/` directory
- Generate IDs with `Math.random().toString(36)` or `Date.now()` based patterns
- State interfaces define both data shape and action signatures

### Styling

- **Tailwind CSS v4** with CSS custom properties for theming (`var(--foreground)`, `var(--background)`, etc.)
- Use `cn()` utility from `@goalify/ui` or local utils for conditional class merging (clsx + tailwind-merge)
- UI components use **class-variance-authority (cva)** for variant definitions
- CSS variables follow shadcn/ui conventions (`--primary`, `--muted-foreground`, `--border`, etc.)

### Internationalization

- i18next with `react-i18next` for translations
- Use `useTranslation()` hook and `t()` function in components
- Translation keys organized by feature: `t('gantt.week')`, `t('date.weekdays.0')`
- Locale files in `src/locales/`

### Error Handling

- No centralized error boundary pattern observed — handle errors locally
- Guard clauses for null/undefined checks
- Use optional chaining (`?.`) and nullish coalescing (`??`) where appropriate
- Zustand actions return values for navigation decisions (e.g., `closeTab` returns next tab ID)

### Project Structure

```
packages/
  web/
    src/
      components/     # Feature components
      contexts/       # React contexts + Zustand stores (mixed)
      hooks/          # Custom hooks
      pages/          # Route-level page components
      stores/         # Zustand stores
      types/          # TypeScript type definitions
      locales/        # i18n translation files
  ui/
    src/
      components/     # Radix-based UI primitives
      lib/            # Shared utilities (cn, etc.)
      index.ts        # Barrel exports
```

### Git Workflow

- Conventional Commits enforced: `feat:`, `fix:`, `chore:`, `refactor:`, etc.
- Husky pre-commit hooks run lint-staged
- No branch naming conventions documented — follow standard practice (`feature/`, `fix/`, etc.)

### Key Patterns

- **Gantt chart architecture:** Context provider wraps app, Zustand stores manage project/task state, components consume via hooks
- **Tab system:** Zustand-persisted tab state with sync to project lifecycle
- **UI primitives:** shadcn/ui pattern — Radix UI + CVA variants + Tailwind + `cn()` utility
