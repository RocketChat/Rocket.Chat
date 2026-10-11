---
'@rocket.chat/logo': patch
---

Declared `@rocket.chat/fuselage-tokens` as a dependency. Both logo components load its colors at runtime, but it was only a devDependency, so installing `@rocket.chat/logo` on its own failed to resolve it.
