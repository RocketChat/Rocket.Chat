---
'@rocket.chat/meteor': major
---

**Breaking:** every REST refusal answers **403** with one body shape: `{ success: false, error: '<reason>', errorType: 'error-forbidden' }`. `errorType` is always `error-forbidden`; `error` explains the refusal.

- `error-not-allowed`, `not-allowed`, the unprefixed `not-authorized`, `no-permission` and `error-not-authorized-federation` now answer 403 instead of 400, whether the endpoint throws them as a Rocket.Chat error or as a plain `Error` whose message is the code. This covers, among others, `chat.pinMessage`, `chat.unPinMessage`, `chat.starMessage`, `chat.unStarMessage`, `chat.react`, the thread and message endpoints refused by settings or room access, `rooms.info` and `rooms.getDiscussions` without room access, `chat.delete` with `asUser` without `force-delete-message`, `statistics`, integrations, and `users.generatePersonalAccessToken`, `users.regeneratePersonalAccessToken` and `users.removePersonalAccessToken`.
- Clients that read the original code from `errorType` (`error-not-allowed`, `not-authorized`, `error-not-authorized`, …) now get `error-forbidden`. The permission check declared on a route answers `User does not have the permissions required for this action`, without the `[error-unauthorized]` suffix.
- 403 bodies carry no `details` or `stack`.
- The DDP methods keep throwing their original error codes.
