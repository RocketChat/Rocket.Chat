---
'@rocket.chat/eslint-config': patch
---

Fixes the Storybook lint rules crashing on ESLint 10 by upgrading `eslint-plugin-storybook` to a release that no longer calls the removed `context.getFilename()` and `context.getSourceCode()` APIs
