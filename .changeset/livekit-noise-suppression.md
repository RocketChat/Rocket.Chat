---
'@rocket.chat/meteor': minor
'@rocket.chat/i18n': minor
'@rocket.chat/ui-conference': minor
'@rocket.chat/ui-livekit': minor
---

Adds a noise cancellation choice to the microphone menus of native LiveKit calls: off, the browser's own filter (the default), or RNNoise running on the device to also remove typing and background noise. The workspace serves RNNoise itself, so clients never fetch it from a third party.
