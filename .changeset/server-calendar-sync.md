---
'@rocket.chat/meteor': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
---

Added a server-to-server Outlook/Exchange calendar sync (Premium, `outlook-calendar` module). A new `Calendar_Sync` admin settings group configures a scheduled server-side synchronization of users' calendars using the Microsoft Graph API with the OAuth 2.0 client credentials flow — users no longer need to authenticate against Outlook from their own clients. Synced events flow through the existing calendar service, driving the same reminders and busy-presence behavior as the client-based integration, which remains available and unchanged. Includes delta-query incremental sync, throttling-aware retries, per-user sync state with diagnostics fields, and mailbox mapping via verified email or a user custom field. Support for on-premises Exchange (EWS) and a privacy-minimizing free/busy-only mode will follow in the same settings group.
