---
'@rocket.chat/meteor': patch
---

Resolves the issue where outgoing integrations failed to trigger after the version 6.12.0 upgrade by correcting the parameter order from the `afterSaveMessage` callback to listener functions. This ensures the correct room information is passed, restoring the functionality of outgoing webhooks, IRC bridge, Autotranslate, and Engagement Dashboard.
