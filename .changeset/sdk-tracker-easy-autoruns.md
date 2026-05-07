---
'@rocket.chat/meteor': patch
---

Drop Meteor `Tracker.autorun` from three client call sites in favour of direct event subscriptions. `meteorBackedSdk`'s connection-status bridge now listens on `Meteor.connection._stream`'s low-level `'connected'`/`'disconnect'`/`'reset'` events instead of riding `Meteor.status()`'s reactive layer; `CachedStore`'s post-reconnect cache sync now hooks `sdk.connection.on('connection', …)` directly; `createComposerAPI`'s formatting-button watcher subscribes to `settings.observe('*', …)`. Net behaviour is unchanged — same recompute / re-sync triggers — but the reactivity travels through the SDK and the settings store rather than Tracker, removing 3 of the 10 client `meteor/tracker` imports.
