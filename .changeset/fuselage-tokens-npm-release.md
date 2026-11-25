---
'@rocket.chat/fuselage-tokens': patch
---

Publishes the Rocket.Chat build of `@rocket.chat/fuselage-tokens` to npm under a free version number. The `0.36.0` on npm came from the archived fuselage repository and does not ship `dist/spacing.json`, so `@rocket.chat/fuselage@1.0.0` failed to load in projects that install it from npm.
