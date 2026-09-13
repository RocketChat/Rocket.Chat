---
'@rocket.chat/core-services': minor
'@rocket.chat/federation-matrix': patch
'@rocket.chat/meteor': patch
---

Fixes incoming federated media messages being lost when the sending server had not finished committing the upload

An event describing a file routinely reaches us before the origin can serve it: while the sender is still committing a large upload, every media download endpoint answers 404. Because the file was downloaded while the event was being processed, that 404 failed the whole message, and the message was dropped rather than retried.

Remote files are now registered when their event arrives and fetched the first time somebody opens them, which is also how other homeservers behave. Nothing about delivering the message depends on the file being available yet — the name, size, type and dimensions all come from the event itself — and no server is polled for a file nobody has asked for.
