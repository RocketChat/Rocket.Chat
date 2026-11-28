---
'@rocket.chat/xmpp-server': patch
---

Fixes XMPP invitations that let a user on any accepted XMPP server add a local user to a room the workspace hosts, including a private group nobody added them to or one they were banned from, which also lifted the ban. An invitation naming a room on the workspace's own XMPP domains is now ignored, so only Rocket.Chat decides who joins the rooms it hosts. Invitations into rooms on other XMPP servers work as before.
