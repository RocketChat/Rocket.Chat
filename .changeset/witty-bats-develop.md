---
"@rocket.chat/meteor": patch
"@rocket.chat/apps": patch
"@rocket.chat/core-services": patch
"@rocket.chat/core-typings": patch
"@rocket.chat/fuselage-ui-kit": patch
"@rocket.chat/rest-typings": patch
"@rocket.chat/ddp-streamer": patch
"@rocket.chat/presence": patch
"rocketchat-services": patch
---

Pass `user` param to apps-engine during app update, allowing apps' new `onUpdate` hook to know who triggered the update.
