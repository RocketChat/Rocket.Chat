---
'@rocket.chat/ui-kit': minor
'@rocket.chat/fuselage-ui-kit': patch
'@rocket.chat/livechat': patch
'@rocket.chat/meteor': patch
---

Fixes UiKit buttons, icon buttons and overflow options opening any URL an app sends, including `javascript:` URLs. Only `http:`, `https:`, `mailto:`, `tel:` and root-relative URLs are opened now; `@rocket.chat/ui-kit` exports the check as `isSafeUrl`.
