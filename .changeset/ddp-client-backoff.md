---
'@rocket.chat/ddp-client': minor
---

Changes the reconnection strategy to an exponential backoff with jitter, capped at 30 seconds, and makes `DDPSDK.create` and `RocketchatSdkLegacyImpl.create` keep reconnecting by default (`retryCount: Infinity`, `retryTime: 1000`) instead of giving up after one retry at 100 ms. `LivechatClientImpl` keeps its own defaults (3 retries from 10 seconds).
