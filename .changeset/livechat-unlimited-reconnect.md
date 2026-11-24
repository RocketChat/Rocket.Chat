---
'@rocket.chat/ddp-client': patch
'@rocket.chat/livechat': patch
---

Fixes the Livechat widget no longer showing new messages after a network outage longer than about a minute; the widget now keeps trying to reconnect until the server is reachable again
