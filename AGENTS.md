# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router (pages, layouts, and API handlers in `app/api/*/route.ts`). Global styles in `app/globals.css`.
- `components/`: Reusable React components (PascalCase files).
- `lib/`: Utilities for server/client (e.g., `supabase.ts`, crypto, email). Prefer named exports.
- `supabase/`: Database schema and RLS policies (`schema.sql`).
- Tooling: `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`.

## Build, Test, and Development Commands
- `npm run dev`: Start the dev server at `http://localhost:3000`.
- `npm run build`: Production build (type-checks during build).
- `npm start`: Serve the production build.
- `npm run lint`: ESLint via Next.js rules.
- `npx tsc --noEmit`: Type-check without emitting files.

## Coding Style & Naming Conventions
- TypeScript (strict) with 2-space indentation; follow ESLint (Next.js config).
- Components: PascalCase; hooks/functions/variables: camelCase; route segment folders: kebab/lowercase.
- Use `@/` path alias for root imports. Keep server-only logic in files that import `server-only`.
- Tailwind CSS for styling; co-locate minimal styles with components when practical.

## Testing Guidelines
- No test framework is configured yet. For now, rely on `npm run lint` and `npx tsc --noEmit`.
- If adding tests: use `*.test.ts`/`*.test.tsx` co-located or in `__tests__/`; aim for critical-path coverage first (lib utilities, API handlers).

## Commit & Pull Request Guidelines
- Commits: imperative mood ("Fix", "Add"), concise subject, include context when needed; link issues (`#123`).
- PRs: focused scope; include description, screenshots for UI changes, and validation steps. Note schema updates (`supabase/schema.sql`) and any env var changes.
- Before opening: run `npm run lint` and `npm run build` locally.

## Security & Configuration Tips
- Secrets in `.env.local` (do not commit). Common vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `POSTMARK_API_KEY`, `POSTMARK_FROM_EMAIL`, optional `POSTMARK_MESSAGE_STREAM`, `NEXT_PUBLIC_APP_URL`.
- Never expose `SUPABASE_SERVICE_KEY` to the client; use it only in server code (`lib/`, route handlers) and prefer `server-only` imports.
- Supabase RLS is enabled; use service-role access only on trusted server paths.

