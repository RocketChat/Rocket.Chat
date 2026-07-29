---
'@rocket.chat/meteor': patch
'@rocket.chat/license': patch
---

Fixes the license provided via the `ROCKETCHAT_LICENSE` environment variable not being applied when it is newer than the one persisted in the workspace.
