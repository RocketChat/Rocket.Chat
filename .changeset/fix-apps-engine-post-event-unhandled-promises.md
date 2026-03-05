---
"@rocket.chat/apps-engine": patch
---

Fixed unhandled promise rejections in `AppListenerManager` for fire-and-forget post-event handlers (`IPostMessageSent`, `IPostSystemMessageSent`, `IPostMessageDeleted`, `IPostMessageUpdated`, `IPostRoomCreate`, `IPostRoomDeleted`, `IPostExternalComponentOpened`, `IPostExternalComponentClosed`). These async methods were called without `await` and without a rejection handler, which could cause `UnhandledPromiseRejection` errors (process-terminating in Node.js 15+) if an app threw inside a post-event hook. The fire-and-forget behavior is preserved — post events intentionally do not block the caller — but errors are now surfaced to the console.
