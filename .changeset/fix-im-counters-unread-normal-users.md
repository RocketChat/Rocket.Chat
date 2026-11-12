---
'@rocket.chat/meteor': patch
---

fix: `im.counters` returns wrong unread count for standard users (#23977)

The `/api/v1/im.counters` endpoint had two issues affecting standard (non-admin) users:

1. **Unread count blocked by admin-only gate**: When a standard user passed their own `userId` as a query parameter, the endpoint returned `403 Forbidden`. The permission check required `view-room-administration` for any `userId` param, even when the requesting user was asking about themselves.

2. **Missing ownership guard on subscription metrics**: `unreads`, `unreadsFrom`, and `userMentions` were exposed from the subscription document without explicitly verifying that the subscription belonged to the requesting user, creating a potential data-exposure risk.

**Fix:**
- Allow standard users to pass `userId` equal to their own ID without admin privileges. Admin permission is now only enforced when querying on behalf of a *different* user.
- Added an explicit `subscription.u._id === this.userId` ownership check before returning unread metrics, ensuring users can only read their own subscription data.

