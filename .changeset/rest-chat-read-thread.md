---
'@rocket.chat/meteor': minor
---

Added `POST /v1/chat.readThread` body `{ tmid }`, which marks a single thread as read for the caller — clearing the thread from the subscription's unread list and running the `beforeReadMessages` / `afterReadMessages` callbacks. It replaces the `readThreads` DDP method, which stays registered with a deprecation log pointing at the new route until 9.0.0.

`POST /v1/subscriptions.read` does not cover this: it takes `{ rid, readThreads? }` and operates on the whole room, with no way to address one thread.
