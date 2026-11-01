# lolinder web-client

Vue 3 + Vite frontend for lolinder. Project docs: `../lolinder-docs.md`.

## Setup

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

## Scripts

| Script                         | What it does                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `pnpm dev`                     | Dev server on http://localhost:5173                                                              |
| `pnpm build`                   | Type-check and production build                                                                  |
| `pnpm gen:api`                 | Regenerate the API client from `http://localhost:3000/docs-json` (override with `OPENAPI_INPUT`) |
| `pnpm palette`                 | Regenerate the color tokens in `src/styles/main.css` from the seed                               |
| `pnpm palette:check`           | Check text and icon contrast of the generated palette                                            |
| `pnpm lint`                    | Oxlint, then ESLint (Vue templates, i18n, import boundaries)                                     |
| `pnpm format` / `format:check` | Prettier                                                                                         |
| `pnpm test`                    | Vitest unit tests                                                                                |
| `pnpm test:e2e`                | Playwright e2e (run `pnpm exec playwright install chromium` once)                                |

## Structure

```
src/
  app/          router, layouts, root component
  pages/        route components; compose features
  features/     user-facing features; each exports through its index.ts
  components/   ui/ (shadcn-vue, generated) and shared domain components
  shared/       api (generated client), i18n, lib
  locales/      ru.json, en.json
  styles/       Tailwind entry and theme tokens
```

Import rules, enforced by `eslint-plugin-boundaries`:

- a feature never imports another feature; pages and `app` combine them;
- pages and `app` import a feature only through its `index.ts`;
- `components` and `shared` never import features or pages.

`src/shared/api/generated/` and `src/components/ui/` are generated: don't edit them by hand.
