---
"@rocket.chat/meteor": patch
"@rocket.chat/models": patch
---

Deprecates the use of MongoDB oplog or Change Streams to receive real time data updates.

The previous behavior can still be enabled using the environment flag `DISABLE_DB_WATCHERS=false`.

⚠️ In future major versions, this flag will be completely removed, and the `@rocket.chat/stream-hub-service` package and the `stream-hub-service` At that time the Docker image will no longer be published.
