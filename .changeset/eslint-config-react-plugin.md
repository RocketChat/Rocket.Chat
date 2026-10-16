---
'@rocket.chat/eslint-config': patch
---

Fixes `@rocket.chat/eslint-config` failing to install with npm, which rejected its `eslint-plugin-react` dependency because it pointed at a Yarn patch
