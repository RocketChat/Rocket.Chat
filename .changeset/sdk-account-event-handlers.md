---
'@rocket.chat/ddp-client': minor
---

Add lifecycle event handlers to `Account`: `onLogin`, `onLogout`, `onEmailVerificationLink`, and `onPageLoadLogin`. `onLogin` / `onLogout` fire on `uid` transitions (the setter now emits only when the value changes, so a single login or logout produces exactly one callback). `onEmailVerificationLink` and `onPageLoadLogin` are listener-storage extension points fed by `_emitEmailVerificationLink` / `_emitPageLoadLogin`; the bridge from Meteor's accounts-base lives in the consumer (`apps/meteor/client`) so the package stays Meteor-independent. All four return an unsubscribe function.
