---
'@rocket.chat/meteor': patch
---

Migrate the `loadMissedMessages` DDP caller to `GET /v1/chat.syncMessages`. The client maps the serialized response through `mapMessageFromApi` so dates land as `Date` objects in the local Messages store. The DDP method keeps a deprecation log pointing at the REST route until the 9.0.0 sweep removes it.
