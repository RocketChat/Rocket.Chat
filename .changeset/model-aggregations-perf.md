---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
'@rocket.chat/model-typings': patch
---

Improved loading time of the Omnichannel Analytics dashboards (conversation totalizers and the transferred-chats department report) on workspaces with large message volumes, reduced the database work done by the Omnichannel queue worker on busy queues, and fixed a failure that could prevent E2EE key redistribution in encrypted rooms with very large memberships.
