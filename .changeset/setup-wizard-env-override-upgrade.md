---
'@rocket.chat/meteor': patch
---

Fixes the setup wizard being forced back into the registration step on the first start after an upgrade when `OVERWRITE_SETTING_Show_Setup_Wizard=completed` is set, which affected air-gapped workspaces running offline licenses without cloud registration.
