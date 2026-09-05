# Copilot context

## Project

`studio-rm3` is a Next.js study planner built with React and TypeScript. The
application includes exam planning, study progress tracking, Supabase-backed
data synchronization, AI coaching, and PWA features.

## Repository structure

- `app/`: Next.js App Router pages, layout, manifest, and API routes
- `components/`: Feature components and shared UI components
- `hooks/`: Reusable React hooks
- `lib/planner/`: Planner types, algorithms, helpers, and data access
- `lib/supabase/`: Supabase client and persistence helpers

## Development commands

```bash
npm run dev
npm run type-check
npm run lint
npm run build
```

## Contribution guidance

- Keep changes focused on the requested feature.
- Use the existing components, hooks, and utility libraries before adding new
  dependencies.
- Keep Supabase access in `lib/supabase/` and preserve existing row-level
  security assumptions.
- Run type checking and linting before submitting changes.
