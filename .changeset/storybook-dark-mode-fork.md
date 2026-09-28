---
'@rocket.chat/storybook-dark-mode': minor
---

Declares `storybook` as a peer dependency, at `^9.0.0`. The addon has always imported from `storybook/preview-api`, `storybook/manager-api`, `storybook/theming` and several `storybook/internal/*` paths, but never said so, which left the requirement implicit and the internal APIs it relies on without a version contract.

Also stops shipping `.d.ts` and `.d.ts.map` files inside `dist/esm` and `dist/cjs`. Declarations were being emitted three times over and only the `dist/ts` copy is referenced by `types`, so the other two were dead weight in the tarball. Anything deep-importing types from `dist/esm` or `dist/cjs` — as opposed to resolving them through the package entry point — needs to use `dist/ts` instead.
