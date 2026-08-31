---
'@rocket.chat/meteor': patch
---

Fixes client-safe errors being reported as exceptions to the channel configured in `Log Exceptions to Channel` when `Log_Level` is set to `2`.
