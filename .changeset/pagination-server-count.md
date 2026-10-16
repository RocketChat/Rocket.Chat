---
'@rocket.chat/meteor': patch
---

Fixes paginated tables skipping items when `API_Upper_Count_Limit` is lower than the selected page size, and keeping the current page when filters change
