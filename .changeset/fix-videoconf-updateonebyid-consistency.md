---
'@rocket.chat/models': patch
---

fix(models): standardize `setDiscussionRidById` and `unsetDiscussionRidById` to use `updateOneById` and `$unset: 1 as const`
