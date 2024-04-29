---
"@rocket.chat/meteor": patch
---

Fixed a problem that caused `afterCreateUser` callback to be called without new user's roles inside. This caused Omnichannel Business Hour manager to ignore these users from assigning open business hours until the manager restarted or the business hour restarted.
