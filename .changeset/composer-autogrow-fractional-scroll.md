---
'@rocket.chat/meteor': patch
---

Fixes the message composer occasionally not keeping the caret pinned to the bottom while a long message auto-grows, on high-DPI displays or at non-100% browser zoom. The scroll-to-bottom check used strict equality against `scrollHeight`, which fails when `scrollTop` is fractional; it now uses a one-pixel tolerance.
