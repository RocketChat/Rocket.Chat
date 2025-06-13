---
"@rocket.chat/meteor": patch
"@rocket.chat/model-typings": patch
"@rocket.chat/models": patch
---

Fixed contacts being marked as `known` after editing a custom field, or resolving conflicts by adding a new model function that only updates the `customFields` or `conflictingFields` prop.
