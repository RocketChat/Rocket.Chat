---
'@rocket.chat/meteor': patch
---

Fixes slash command params being silently truncated when the message contains a newline (Shift+Enter). The client-side regex in `processSlashCommand.ts` now uses the dotall (`s`) flag so raw multi-line params are passed to the command handler in full, matching the existing behavior of the server-side parser. Additionally, the `/msg` slash command now accepts line breaks between `@username` and the message body.
