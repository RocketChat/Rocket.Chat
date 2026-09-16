---
'@rocket.chat/rest-typings': patch
'@rocket.chat/meteor': patch
---

Describes the REST API's pagination in one place instead of restating it at every endpoint. `count` and `offset` now come from a shared schema across every offset-paginated endpoint, which also states in the generated API docs what the server does with `count`: a page holds `min(count, API_Upper_Count_Limit)` items, so a response can be smaller than requested and callers should page by what came back. They are now validated as non-negative integers, so requests carrying a negative or fractional `count` or `offset` — previously accepted, then silently coerced — are rejected.
