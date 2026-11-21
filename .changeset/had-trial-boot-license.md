---
'@rocket.chat/meteor': patch
---

Fixes workspaces whose trial license is applied at startup, for example through `ROCKETCHAT_LICENSE`, not being recorded as having had a trial, so upsell prompts kept offering a trial after it ended
