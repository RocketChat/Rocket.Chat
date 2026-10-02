---
'@rocket.chat/ui-contexts': minor
'@rocket.chat/mock-providers': minor
'@rocket.chat/livechat': patch
'@rocket.chat/meteor': patch
---

Moves the connection status out of the `ServerContext` value: it is now read through `subscribeToConnectionStatus`/`getConnectionStatus` (as `useConnectionStatus` does), so connection changes no longer re-render every server context consumer. `mockAppRoot()` gains `withConnectionStatus()`.
