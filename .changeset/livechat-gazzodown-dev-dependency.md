---
'@rocket.chat/livechat': patch
---

Fixes the install of the package from npm. It depended on `@rocket.chat/gazzodown` and `@rocket.chat/random`, which are not published; the bundle already includes them. The published package now also contains the build, which it was missing.
