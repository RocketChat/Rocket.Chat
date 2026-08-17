---
'@rocket.chat/core-services': patch
'@rocket.chat/model-typings': patch
'@rocket.chat/rest-typings': patch
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Adds status visibility, letting users hide their presence and status message from specific people they choose. Blocked people see that user as offline, indistinguishable from genuinely offline, and the block can be lifted at any time — changes apply live, without a reload.
