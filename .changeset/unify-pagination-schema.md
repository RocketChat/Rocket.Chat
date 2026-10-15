---
'@rocket.chat/rest-typings': patch
'@rocket.chat/meteor': patch
---

Describes the REST API's pagination in one place instead of restating it at every endpoint. `count` and `offset` now come from a shared schema across every offset-paginated endpoint, which also states in the generated API docs what the server does with `count`: for a positive `count`, a page holds at most `min(count, API_Upper_Count_Limit)` items, so a response can be smaller than requested and callers should page by what came back; a `count` of zero returns every item when `API_Allow_Infinite_Count` is enabled. Where an endpoint validates its query, `count` and `offset` are now checked as non-negative integers, so a negative or fractional value — previously accepted, then silently coerced — is rejected.
