---
'@rocket.chat/ui-kit': minor
'@rocket.chat/fuselage-ui-kit': patch
'@rocket.chat/livechat': patch
'@rocket.chat/meteor': patch
---

Fixes UiKit buttons, icon buttons and overflow options opening `javascript:`, `data:` and `vbscript:` URLs sent by apps. Those URLs are now ignored; every other URL, including app deep links and relative URLs, opens as before. `@rocket.chat/ui-kit` exports the check as `isSafeUrl`.
