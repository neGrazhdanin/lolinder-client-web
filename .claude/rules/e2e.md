---
paths:
  - 'e2e/**'
  - 'playwright.config.ts'
---

# Playwright tests

- Tests never reach the network: `MockApi` (`e2e/fixtures/mock.ts`) answers the API by path and returns 404 for
  any call without a mock, so a missing mock fails loudly; Data Dragon images are a 1×1 PNG.
- Shared response data lives in `e2e/fixtures/data.ts`; extend it instead of inlining large payloads.
- One file: `pnpm test:e2e e2e/match.spec.ts`.
