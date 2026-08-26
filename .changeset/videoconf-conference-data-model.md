---
'@rocket.chat/core-services': patch
'@rocket.chat/core-typings': patch
'@rocket.chat/model-typings': patch
'@rocket.chat/rest-typings': patch
'@rocket.chat/ddp-client': patch
'@rocket.chat/models': patch
'@rocket.chat/i18n': patch
'@rocket.chat/meteor': patch
---

Groundwork for the video conference window: no user-facing change.

Conference records gain per-member lifecycle fields (joined, declined, left, last seen, ringing) and the service gains the operations a call window needs — leaving, heartbeats, ringing again, declining, adding participants, renaming, resolving where the call's chat lives — behind new REST endpoints. A cron sweeps presence leases so a call whose participants vanish is closed rather than left running.

All of the new behaviour is reserved for providers whose call renders inside Rocket.Chat, identified by an `embedded` capability. No provider registers that capability yet, so on any existing workspace every one of these paths is skipped and calls placed through Jitsi, Google Meet, BBB or Pexip behave exactly as before. The endpoints are additive and no client calls them yet.
