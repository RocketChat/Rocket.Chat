---
'@rocket.chat/models': minor
'@rocket.chat/meteor': minor
---

Updates the behavior of the `Livechat_enabled_when_agent_idle` setting. When enabled, the routing query now excludes `offline` agents, ensuring no new conversations are assigned to them.
