---
'@rocket.chat/meteor': patch
---

Migrated the last two thread-read call sites (`ThreadChat`, `useThreadMessagesQuery`) from the `readThreads` DDP method to `POST /v1/chat.readThread`, and pointed the admin "send a test push to my user" setting at `POST /v1/push.test` instead of the `push_test` DDP method. Both DDP methods stay registered with deprecation logs pointing at the new routes until 9.0.0.

`POST /v1/push.test` now also returns the `message` translation key and its `params`, matching what the DDP method returned, so the admin setting still reports how many devices the test reached.
