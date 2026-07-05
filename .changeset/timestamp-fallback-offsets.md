---
"@rocket.chat/message-parser": minor
---

Normalizes the `Timestamp` node's `fallback` to the same `[start, end]` source-offset span used by other blocks, instead of a reconstructed plain-text node. The type still allows the previous `Plain` form so already-persisted data keeps type-checking and is safely ignored at render time.
