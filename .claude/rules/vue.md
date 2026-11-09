---
paths:
  - 'src/**/*.vue'
---

# Vue components

- Dark-theme overrides in scoped CSS are written `.x:where(.dark *)`; `:global(.dark) .x` compiles to a
  selector that never matches.
- Data Dragon descriptions contain markup: parse them into nodes and render with `h()`, never `v-html`.
- The look is flat Material 3: tonal surfaces from the palette variables, no gradients.
