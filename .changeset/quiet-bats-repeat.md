---
"@rocket.chat/apps-engine": minor
"@rocket.chat/apps": minor
"@rocket.chat/meteor": minor
---

Adds a read-only call history accessor for apps. An app that declares the new `media-call.history` permission can read a user's call history through `read.getCallHistoryReader()`, which exposes `getById`, `getByCallId` and a paginated `search`.
