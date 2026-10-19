---
'@rocket.chat/ui-client': minor
---

Adds `usePaginatedQuery`, which fills each table page with as many requests as needed when the server returns fewer items than requested and merges them with a `combineData` reducer, such as `getCombineFn(itemsKey)` for responses that keep their rows under one key. Also adds a `resetKey` option to `usePagination` that goes back to the first page when the key changes
