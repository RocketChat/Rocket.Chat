---
'@rocket.chat/apps-engine': patch
---

Fixes an issue where app-defined API endpoints with dynamic paths could fail to receive requests when using path parameters like `:param`.
