---
'@rocket.chat/ui-client': minor
---

Adds `usePaginatedQuery`, which fills each table page with as many requests as needed when the server returns fewer items than requested and merges them, either joining the rows under `itemsKey` or through a custom `combine` function over the query results. Also adds a `resetKey` option to `usePagination` that goes back to the first page when the key changes
