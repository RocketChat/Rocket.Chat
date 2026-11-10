---
'@rocket.chat/fuselage': patch
---

Fixes two message parts rendering broken class names: `MessageStatusPrivateIndicator` rendered a stray backtick instead of `rcx-message-status-indicator__item--private`, and `MessageReactionCounter` added an `undefined` class when it got no `className`.
