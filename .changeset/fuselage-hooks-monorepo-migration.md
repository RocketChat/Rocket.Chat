---
'@rocket.chat/fuselage-hooks': patch
---

Moved `@rocket.chat/fuselage-hooks` into the Rocket.Chat monorepo, continuing from the frozen Fuselage 0.43.1 release. The exported hooks keep the same API; `@rocket.chat/emitter` and `@rocket.chat/fuselage-tokens` are now regular dependencies instead of bundled peers.
