---
"@rocket.chat/meteor": patch
---

Fixes a bug where the `/api/v1/users.update` API call was replacing the entire `customFields` object instead of merging only the specified properties. The fix ensures that when updating custom fields, existing values are preserved while only specified fields are updated or added.