# lolinder web-client

Vue 3 + Vite SPA for lolinder (LoL stats + social layer). Product, screens and roadmap:
`../lolinder-docs.md` (local file outside the repo); mockups are linked from there.
Layout and import rules: `README.md`, enforced by `eslint-plugin-boundaries`.
Tasks live in GitHub Issues of this repo; backend epics are in `lolinder-api` #19–#23.

## Verify before handing over

`pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Playwright: `pnpm test:e2e`
(needs `pnpm exec playwright install chromium` once). `pnpm lint` auto-fixes; review what it changed.

## API client

- `src/shared/api/generated/` is produced by `pnpm gen:api` from the running backend
  (`http://localhost:3000/docs-json`). Never edit it; regenerate after a backend contract change and commit the result.
- Errors arrive as `{ code }`. Map them with `errorMessageKey()` (`src/shared/api/errors.ts`) to
  `errors.<CODE>` i18n keys; backend text is never shown to users.
- Server state lives in TanStack Query; UI state in Pinia setup stores. Paginated lists use
  `nextCursor` with infinite queries.
- Player data may arrive with `sync: 'syncing'`: show the cached data and refetch on the
  `player:updated` WebSocket event instead of polling.

## UI rules

- Every user-visible string goes through vue-i18n and exists in both `src/locales/ru.json` and `en.json`;
  `no-raw-text` is an ESLint error. Dates, numbers and plurals are formatted with `Intl` per locale.
- Colors only via shadcn CSS variables (`--background`, `--card`, `--muted`, `--win`, `--loss`, …), so both
  themes work; text contrast stays ≥ 4.5:1. Charts take colors from the same variables.
- `src/components/ui/` is shadcn-vue output: add components with the shadcn-vue CLI, never hand-write them.
- Champion, item and rune names and icons come from Data Dragon by the current patch and locale;
  the API only sends IDs.
- Mobile first: the shell switches to a bottom tab bar on small screens; new pages must work there.

## Workflow

- Branch per issue: `<type>/<issue>-<slug>`. PR description has `Closes #N`.
- Commits: Conventional Commits in English, subject ≤ 72 chars, a body only when the why is not obvious
  from the diff. No `Co-Authored-By` or "Generated with" trailers.
- Commit or push only when asked.
