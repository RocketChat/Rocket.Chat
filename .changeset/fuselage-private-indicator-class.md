---
'@rocket.chat/fuselage': patch
---

Fixes `MessageStatusPrivateIndicator` rendering a stray backtick in its class, so its element gets `rcx-message-status-indicator__item--private` again.
