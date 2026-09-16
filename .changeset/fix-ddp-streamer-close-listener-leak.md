---
'@rocket.chat/ddp-streamer': patch
---

Fixes a memory leak in the DDP streamer where each `Publication` registered a one-time `close` listener on its client but never removed it when the publication stopped independently of the client closing. Long-lived clients with high subscription churn would accumulate stale listeners, eventually hitting `MaxListenersExceededWarning: Possible EventEmitter memory leak detected` and, in production, crashing the process. The client-close listener is now removed as part of the publication's `stop` cleanup.
