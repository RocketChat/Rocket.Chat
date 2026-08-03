---
'@rocket.chat/meteor': patch
---

Fixes thread replies and the thread list not loading when the `threadMessagesSize` or `threadsListSize` client config value is not a valid number. The value was used as the pagination count without validation, so the client requested `count=NaN` and the server rejected the request.
