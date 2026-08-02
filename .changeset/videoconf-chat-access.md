---
'@rocket.chat/core-services': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

The conference page and its chat panel now surface members who are in the call but cannot read its chat — a consequence of conference membership granting no room access — with a single action that gives them access. The server picks the only mechanism the room allows: any room that can take new members is joined, while a DM's chat moves to a discussion carrying everyone. `video-conference.info` reports those members, and `POST /v1/video-conference.share-chat` applies the remedy.
