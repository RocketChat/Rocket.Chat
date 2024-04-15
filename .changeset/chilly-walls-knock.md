---
'@rocket.chat/meteor': patch
---

Fixed an issue while creating tokens via the special `users.createToken` API was not respecting the maximum login tokens allowed for a user.

The following endpoint was deprecated and will be removed on version `8.0.0`:

- `/api/v1/users.createToken`

The following Meteor method (realtime API) was deprecated and will be removed on version `8.0.0`:

- `createToken`
