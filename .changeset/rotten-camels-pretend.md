---
"@rocket.chat/meteor": patch
"@rocket.chat/core-typings": patch
---

Fixed issue with system messages being counted as agents' first responses in livechat rooms (which caused the "best first response time" and "average first response time" metrics to be unreliable for all agents)
