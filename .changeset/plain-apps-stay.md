---
'@rocket.chat/meteor': patch
'@rocket.chat/ddp-client': patch
'@rocket.chat/ui-kit': patch
---

Fixes UI Kit buttons in messages sending the clicker's credentials to an endpoint other than the app's interaction endpoint when their `appId` is not a valid app ID
