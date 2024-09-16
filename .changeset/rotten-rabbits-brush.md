---
'@rocket.chat/meteor': patch
---

Fixes the parameter order in callbackHandler and updates the integration logic, autotranslate, and the EngagementDashboard.afterSaveMessage trigger to correctly pass the room parameter. This resolves the malfunction in outgoing webhooks and other use cases impacted by the format change introduced in version 6.12.0.
