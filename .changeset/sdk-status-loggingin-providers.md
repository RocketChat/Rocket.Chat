---
'@rocket.chat/meteor': patch
---

Replace `useReactiveValue` (Tracker-based) with `useSyncExternalStore` in `ServerProvider` and `AuthenticationProvider`. `ServerProvider` now subscribes directly to `sdk.connection.on('connection', …)` for status updates and drops its standalone `Tracker.Dependency` (`ddpSdkStatusDep`); `AuthenticationProvider` observes `Accounts.loggingIn()` transitions via a one-time monkey-patch of `Accounts._setLoggingIn` (the same private API already used by `killMeteorStream`). `useReactiveValue` had no remaining consumers after this and is removed. `createReactiveSubscriptionFactory` stays — `AuthorizationProvider` and `UserProvider`'s `queryPreference` still depend on its Tracker-driven reactivity.
