---
'@rocket.chat/apps-engine': minor
'@rocket.chat/apps': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/fuselage-ui-kit': minor
'@rocket.chat/i18n': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/ui-kit': minor
'@rocket.chat/meteor': minor
---

Adds the Home surface: a page per user and app that the app keeps up to date, opened from the "Home" button on an enabled app's details page. Apps publish it with `updateSurfaceView` and `UIKitSurfaceType.HOME`, and receive the new `appHomeOpened` event, `executeAppHomeOpenedHandler`, when a user opens it.
