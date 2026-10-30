---
'@rocket.chat/mongo-adapter': patch
---

Fixes client-side bitwise filters (`$bitsAllSet`, `$bitsAnySet`, `$bitsAllClear`, `$bitsAnyClear`) reading the bytes around a `Uint8Array` view of a larger buffer
