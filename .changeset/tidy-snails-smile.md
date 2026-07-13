---
"@rocket.chat/apps": patch
---

Fix Deno app startup for non-root containers by writing the generated runtime configuration to the writable temporary directory.
