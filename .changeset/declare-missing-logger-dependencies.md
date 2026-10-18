---
'@rocket.chat/core-services': patch
'@rocket.chat/omni-core': patch
---

Declares missing `@rocket.chat/logger` workspace dependency in `package.json` for packages that actively import it, ensuring deterministic Turborepo builds and correct dependency graph resolution.
