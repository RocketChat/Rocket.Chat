---
"@rocket.chat/meteor": patch
---

Fixed an issue that added potencially infinite callbacks to the same event, degrading performance over time.
