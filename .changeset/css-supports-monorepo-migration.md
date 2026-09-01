---
'@rocket.chat/css-supports': patch
---

Moved `@rocket.chat/css-supports` into the Rocket.Chat monorepo, continuing from the frozen Fuselage 0.31.25 release. The memoized, SSR-safe `CSS.supports` facade keeps the same API and runtime behaviour; only its build, lint and test wiring changed, none of which is published.
