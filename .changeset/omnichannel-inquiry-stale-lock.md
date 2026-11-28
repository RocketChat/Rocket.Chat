---
'@rocket.chat/models': patch
'@rocket.chat/model-typings': patch
'@rocket.chat/meteor': patch
---

Fixes Omnichannel inquiries staying in the queue with agents available after a queue cycle was interrupted, where every later attempt to route them failed with `error-taking-inquiry-lockedAt-mismatch`
