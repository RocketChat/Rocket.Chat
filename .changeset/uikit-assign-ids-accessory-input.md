---
'@rocket.chat/apps': patch
'@rocket.chat/meteor': patch
---

Fixes UiKit elements that apps put in a section `accessory` or an `input` block's `element` without an `actionId`: they now get one generated, like the elements of an `actions` block, so their interactions reach the app with an id it can match.
