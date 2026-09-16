---
'@rocket.chat/meteor': patch
---

Fixes the client asking paginated endpoints for more items than the workspace allows. `API_Upper_Count_Limit` is not a public setting, so every caller had to guess a page size, and a guess above the cap was silently reduced by the server — leaving callers paging with a stride the server never agreed to. In the ABAC attribute list, whose guess of 150 sat above the default cap of 100, that silently dropped attributes on a stock workspace. The server now publishes its limit to the page and callers ask for that instead of a number of their own.
