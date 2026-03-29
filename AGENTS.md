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

# Desktop package (Rust/Tauri)
pnpm --filter @goalify/desktop tauri dev
pnpm --filter @goalify/desktop tauri build
cd packages/desktop/src-tauri && cargo build      # Just compile
cd packages/desktop/src-tauri && cargo check      # Type check only

# Mobile package
pnpm --filter @goalify/mobile start          # Expo dev server
pnpm --filter @goalify/mobile ios            # Run on iOS
pnpm --filter @goalify/mobile android        # Run on Android
pnpm --filter @goalify/mobile web            # Run on web
pnpm --filter @goalify/mobile prebuild       # Generate native projects
pnpm --filter @goalify/mobile lint          # eslint .
pnpm --filter @goalify/mobile typecheck     # tsc --noEmit
```

### Type checking

```bash
# Web
cd packages/web && npx tsc --noEmit

# Desktop (Rust)
cd packages/desktop/src-tauri && cargo check
```

### Testing

**No test framework configured.** If adding tests, use Vitest (fits Vite/React stack).

---

## Code Style Guidelines

### Imports

- Use `import type { ... }` for type-only imports
- Path alias `@/*` maps to `./src/*` in web package
- Import shared UI from `@goalify/ui`: `import { Button } from '@goalify/ui'`
- Use `cn()` from `@goalify/ui/lib/utils` for class merging
- Direct lucide-react imports: `import { Check, X } from 'lucide-react'`
- Tauri APIs: Check environment with `const isTauri = typeof window !== "undefined" && "__TAURI__" in window;`

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
    api/            # API layer (Tauri invoke wrappers)
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
  desktop/src-tauri/
    src/
      commands/     # Tauri commands (Rust)
      creem/        # Creem payment integration
      db/           # SQLite operations
      models/       # Data models
      supabase/     # Supabase client
  mobile/           # Expo React Native app
```

---

## Supabase Integration (Authentication & Sync)

### Configuration

- **URL:** https://bvumnoyrcgazjbcznkkt.supabase.co
- **ANON_KEY:** Hardcoded in `supabase/mod.rs`
- Tables: `projects`, `tasks`, `subtasks`, `user_profiles` (with owner_id column for RLS)

### Auth Commands (Rust)

- `sign_up`, `sign_in`, `sign_out` - Authentication
- `get_current_user`, `is_authenticated` - Session management

### Sync Commands

- `sync_push` - Push local data to Supabase (UPSERT)
- `sync_pull` - Pull user's data from Supabase
- `sync_all` - Both push and pull

### Frontend Usage

```typescript
import { authApi } from "@/api/auth";
import { syncApi } from "@/api/sync";
import { useAuthStore } from "@/stores/AuthStore";

// Login triggers auto-sync
await useAuthStore.getState().signIn(email, password);

// Manual sync
await syncApi.all();
```

---

## Membership & Subscription (Creem)

### Overview

Users can subscribe via Creem to become Pro members. Members can create unlimited projects; non-members are limited to 1 project.

### Database Tables

- `public.user_profiles` - Stores membership status (is_member, membership_started_at, membership_expires_at)
- Created via Supabase SQL with RLS policies

### Membership Commands (Rust)

- `create_membership_checkout` - Create Creem checkout URL for upgrading
- `get_membership_status` - Get current user's membership status
- `refresh_membership_status` - Refresh membership status from Supabase

### Security

- **All project limits enforced in Rust backend** (`create_project` command)
- Membership status cached in session, refreshed on login and after payment
- Project count from local SQLite for performance, verified against Supabase for consistency
- Frontend checks are UX-only; backend is source of truth

### Creem Integration

- **Payment Flow:** User clicks upgrade → Rust creates checkout URL → User pays on Creem → Creem sends webhook → Supabase updates membership
- **Webhook:** Supabase Edge Function handles `checkout.completed` events
- **Test Mode:** Uses `test-api.creem.io` with test API keys

### Environment Variables (Desktop)

```env
CREEM_API_KEY=your_api_key
CREEM_PRODUCT_ID=your_product_id
CREEM_TEST_MODE=true
```

### Frontend Usage

```typescript
import { membershipApi } from "@/api/membership";
import { useMembershipStore } from "@/stores/MembershipStore";

// Check membership status
await membershipApi.getStatus();

// Create checkout (returns URL to redirect to)
const checkoutUrl = await membershipApi.createCheckout(successUrl);

// Refresh after payment
await membershipApi.refresh();
```

---

## Git Workflow

- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, etc.
- Husky pre-commit hooks run lint-staged
- Standard branch naming: `feature/`, `fix/`, etc.

---

## Key Patterns

- **Gantt chart:** Context provider wraps app, Zustand stores manage state, components consume via hooks
- **Tab system:** Zustand-persisted tab state synced with project lifecycle
- **UI primitives:** shadcn/ui pattern — Radix UI + CVA + Tailwind + `cn()`
- **Tauri + Rust:** Commands in `src/commands/`, database in `src/db/`, models in `src/models/`
- **Membership:** Session-cached status, backend-enforced limits, Creem webhook for payment
