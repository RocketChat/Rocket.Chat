---
"@rocket.chat/meteor": patch
"@rocket.chat/rest-typings": patch
---

Deprecate `channels.images` in favor of `rooms.images`. `Rooms` endpoints are more broad and should interact with all types of rooms. `Channels` on the other hand are specific to public channels.
This change is to keep the semantics and conventions of the endpoints
