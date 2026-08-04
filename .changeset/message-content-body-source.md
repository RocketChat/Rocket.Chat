---
"@rocket.chat/meteor": patch
---

Passes the original message text to the message renderer so blocks without a dedicated renderer (e.g. tables on clients that don't render them yet) can degrade to their raw markup via the parser's `fallback` source offsets, instead of disappearing.
