---
'@rocket.chat/ui-client': minor
---

Adds `usePaginatedQuery`, which fills each table page with as many requests as needed when the server returns fewer items than requested and either joins the rows under `itemsKey`, runs a custom `combine` over the query results, or returns one query result per request when neither is given; when both are given, `combine` is used. Also adds a `resetKey` option to `usePagination` that goes back to the first page when the key changes
