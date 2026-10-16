---
'@rocket.chat/meteor': patch
---

Fixes duplicate rooms/subscriptions accumulating in the client-side cache (and sidebar) when a record's `_id` arrives as something other than a plain string (e.g. a BSON ObjectId instance or an EJSON binary wrapper, as can happen with manually inserted or migrated documents). `DocumentMapStore` now normalizes `_id` to a stable string before using it as the underlying Map key, so repeated merges of the same record replace the previous entry instead of piling up a new one each time.
