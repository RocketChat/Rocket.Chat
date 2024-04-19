---
"@rocket.chat/meteor": patch
---

**Fixed settings-related statistics not being updated according to the license.**

We've identified an issue where certain statistics were not reflecting recent license changes. This resulted in outdated information being reported for workspaces.
This change ensures that all reported statistics are current and consider the workspace license.
