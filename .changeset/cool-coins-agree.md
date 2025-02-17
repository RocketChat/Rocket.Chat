---
"@rocket.chat/meteor": patch
"@rocket.chat/model-typings": patch
"@rocket.chat/models": patch
---

Fixes a bug that caused routing algorithms to ignore the `Livechat_enabled_when_agent_idle` setting, effectively ignoring idle users from being assigned to inquiries.
