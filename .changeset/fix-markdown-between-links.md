---
"@rocket.chat/message-parser": patch
---

Fixes markdown breaking when text in square brackets appears between hyperlinks. This resolves issues #31418 and #31766 where typing `[text]` between links would incorrectly parse the markdown structure.
