---
'@rocket.chat/meteor': major
---

**Breaking:** every REST refusal answers **403** with one body: `{ success: false, error: 'error-forbidden', errorType: 'error-forbidden' }`.

- `error-not-allowed` and the unprefixed `not-authorized` now answer 403 instead of 400, whether the endpoint throws them as a Rocket.Chat error or as a plain `Error` whose message is the code. This covers, among others, `chat.pinMessage`, `chat.unPinMessage`, `chat.starMessage`, `chat.unStarMessage`, `chat.react`, the thread and message endpoints refused by settings or room access, `rooms.info` and `rooms.getDiscussions` without room access, `chat.delete` with `asUser` without `force-delete-message`, `statistics`, integrations, and `users.generatePersonalAccessToken`, `users.regeneratePersonalAccessToken` and `users.removePersonalAccessToken`.
- The body no longer carries the reason or the original code: `error` and `errorType` are always `error-forbidden` (they used to be messages such as `User does not have the permissions required for this action [error-unauthorized]`, `Not authorized [error-not-authorized]` or `forbidden`, and codes such as `error-not-allowed` or `not-authorized`). 403 bodies carry no `details` or `stack`.
- The DDP methods keep throwing their original error codes.
