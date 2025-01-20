---
"@rocket.chat/omnichannel-services": patch
---

Fixes a behavior when running microservices that caused queue worker to process just the first 60 seconds of request.

This was due to a mistakenly bound context. Queue Worker was changed to start doing work only after it received the first request.

However, with the introduction of ASL and actual context on calls, the worker registration was absorbing the context of the call that created them, causing service calls happening inside the callbacks to fail because of a timeout.
