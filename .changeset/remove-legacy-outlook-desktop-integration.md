---
'@rocket.chat/meteor': major
'@rocket.chat/core-typings': major
'@rocket.chat/desktop-api': major
---

Removes the legacy per-user Outlook integration, where each user signed in to Exchange from the desktop app. The server-to-server integration is now the only mode: the `Exchange_Mode`, `Outlook_Calendar_Exchange_Url`, `Outlook_Calendar_Url_Mapping` and `Calendar_MeetingUrl_Regex` settings are deleted, events created or imported through the API detect their meeting link with the built-in pattern, `getUserInfo` no longer serves an Exchange URL, and the Outlook credential methods leave the desktop bridge contract. `calendar-events.import` stays as a generic import, refused while the integration is enabled. Events the desktop app had imported are kept as the user's own events.
