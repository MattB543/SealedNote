# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router (pages, layouts). API handlers in `app/api/*/route.ts`. Global styles in `app/globals.css`.
- `components/`: Reusable React components (PascalCase files).
- `lib/`: Server/client utilities (e.g., `supabase.ts`, crypto, email). Prefer named exports; add `server-only` to server-only files.
- `supabase/`: Database schema and RLS policies (`schema.sql`).
- Root tooling: `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`.

## Build, Test, and Development Commands
- `npm run dev`: Start the dev server at `http://localhost:3000`.
- `npm run build`: Production build with type-checking.
- `npm start`: Serve the production build.
- `npm run lint`: Run ESLint with Next.js rules.
- `npx tsc --noEmit`: Type-check without emitting files.

## Coding Style & Naming Conventions
- Language: TypeScript (strict), 2-space indentation.
- Names: Components PascalCase; hooks/functions/variables camelCase; route segment folders kebab/lowercase.
- Imports: Use `@/` path alias from project root. Keep server-only logic in files that import `server-only`.
- Styling: Tailwind CSS; co-locate minimal styles with components when practical.

## Testing Guidelines
- No framework configured yet. Rely on `npm run lint` and `npx tsc --noEmit` for now.
- If adding tests: use `*.test.ts`/`*.test.tsx`, co-located or in `__tests__/`.
- Keep tests fast and deterministic; avoid network calls unless mocked.

## Commit & Pull Request Guidelines
- Commits: imperative mood (e.g., "Add", "Fix"), concise subject; include context when helpful. Link issues (`#123`).
- PRs: focused scope; include description, screenshots for UI changes, and validation steps. Note schema updates (`supabase/schema.sql`) and any env var changes.
- Before opening a PR: run `npm run lint` and `npm run build` locally.

## Security & Configuration Tips
- Store secrets in `.env.local` (never commit). Common vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `POSTMARK_API_KEY`, `POSTMARK_FROM_EMAIL`, optional `POSTMARK_MESSAGE_STREAM`, `NEXT_PUBLIC_APP_URL`.
- Never expose `SUPABASE_SERVICE_KEY` to the client; use only in trusted server paths (`lib/`, route handlers) with RLS enabled.
- Prefer server-side calls for sensitive operations; avoid leaking secrets via client props or logs.

