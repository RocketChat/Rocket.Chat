---
'@rocket.chat/core-typings': minor
'@rocket.chat/core-services': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/ddp-client': minor
'@rocket.chat/desktop-api': minor
'@rocket.chat/fuselage-ui-kit': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds persistent chat handling to video conferences: a conference can now be opened in-app at `/conference/:id` as a split view with the call beside its chat, participants (users or dial-out numbers) can be added to an ongoing conference — either keeping the current room's history or moving the chat into a fresh discussion — and every participant's chat follows the conference through a new `video-conference` stream. Conference discussions show a banner to join the ongoing call, `video-conference.join`/`.info` now accept users who only belong to the conference's discussion, and the room's call list becomes a "Conference call history" grouped into ongoing and past calls with each call's discussion name and latest message.
