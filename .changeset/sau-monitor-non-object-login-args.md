---
'@rocket.chat/meteor': patch
---

Prevents a `TypeError` in the `onLogin` SAU monitor hook when `methodArguments` contains non-object values (such as email verification tokens) or lacks connection metadata.
