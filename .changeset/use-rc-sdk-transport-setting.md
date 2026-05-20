---
'@rocket.chat/meteor': minor
---

Adds a new admin setting `Use_RC_SDK` (General → Use Rocket.Chat SDK) that opts the workspace into the experimental SDK-over-DDP transport. When enabled, the client routes Meteor DDP traffic through `@rocket.chat/ddp-client` over a single WebSocket instead of the legacy Meteor stream. The flag is dormant by default; the server surfaces the value via a `<meta name="rc-sdk-transport-enabled">` tag, and the client also honors a per-tab `?sdk_transport=on|off` URL parameter and a `rc-config-sdk_transport` localStorage key (URL > localStorage > meta tag).
