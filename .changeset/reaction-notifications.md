---
'@rocket.chat/meteor': minor
'@rocket.chat/rest-typings': minor
---

Notifies message authors when someone reacts to their message. Delivery reuses the existing desktop/in-app notification pipeline and honors the recipient's per-room desktop preference, mute, and presence status. Gated by a new global admin setting `Reaction_Notifications_Enabled` (enabled by default) and a per-user "Receive reaction notifications" preference (opt-out).
