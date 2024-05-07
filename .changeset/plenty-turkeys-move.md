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

Fixed an issue with some apps that didn't implement executeViewCloseHandler. This causes opened modals to be open forever on UI (unless Esc was clicked). This is because when the UI attempts to close it, it calls the aforementioned handler, and since it didn't exist, apps engine errored out.

This returned an empty response to the UI, which ignored the response and continued to show the view.
