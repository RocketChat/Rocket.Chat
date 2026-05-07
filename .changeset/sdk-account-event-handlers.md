---
'@rocket.chat/ddp-client': minor
---

Add lifecycle event handlers to `Account`: `onLogin`, `onLogout`, `onEmailVerificationLink`, and `onPageLoadLogin`. `onLogin` / `onLogout` fire on `uid` transitions (the setter now emits only when the value changes, so a single login or logout produces exactly one callback). `onEmailVerificationLink` and `onPageLoadLogin` are convenience wrappers around new `Emitter` events of the same names — fire them externally with `account.emit('emailVerificationLink', token)` / `account.emit('pageLoadLogin', loginAttempt)`. The bridge from Meteor's accounts-base lives in the consumer (`apps/meteor/client`) so the package stays Meteor-independent. All four handlers return an unsubscribe function.
