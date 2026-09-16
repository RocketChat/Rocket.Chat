---
'@rocket.chat/ddp-streamer': patch
---

Fixes a memory leak in the DDP streamer where each `Publication` registered a one-time `close` listener on its client but never removed it when the publication stopped independently of the client closing (including when a subscription handler failed). Long-lived clients with high subscription churn would accumulate stale listeners, eventually hitting `MaxListenersExceededWarning: Possible EventEmitter memory leak detected` and risking a process crash from unbounded memory growth. The client-close listener is now removed as part of the publication's `stop` cleanup, including the subscription-failure path.
