---
'@rocket.chat/meteor': major
---

**Breaking:** the REST refusals that the API error switch maps answer **403** with one body shape: `{ success: false, error: '<message>', errorType: 'error-forbidden' }`. `errorType` is always `error-forbidden`; `error` carries the refusal message.

- `error-not-allowed`, `not-allowed`, the unprefixed `not-authorized`, `not_authorized`, `no-permission` and `error-not-authorized-federation` now answer 403 instead of 400, whether the endpoint throws them as a Rocket.Chat error or as a plain `Error` whose message is the code. This covers, among others, `chat.pinMessage`, `chat.unPinMessage`, `chat.starMessage`, `chat.unStarMessage`, `chat.react`, the thread and message endpoints refused by settings or room access, `rooms.info` and `rooms.getDiscussions` without room access, `chat.delete` with `asUser` without `force-delete-message`, `statistics`, the integrations endpoints (including `integrations.create` and `integrations.clearHistory`), `custom-user-status.create`, `custom-user-status.update`, `custom-user-status.delete`, `emoji-custom.delete`, and `users.generatePersonalAccessToken`, `users.regeneratePersonalAccessToken` and `users.removePersonalAccessToken`.
- Clients that read the original code from `errorType` (`error-not-allowed`, `not-authorized`, `error-not-authorized`, …) now get `error-forbidden`. The permission check declared on a route answers `User does not have the permissions required for this action`, without the `[error-unauthorized]` suffix, and a thrown Rocket.Chat error answers its reason (`Threads Disabled`) without the `[error-not-allowed]` suffix.
- `chat.postMessage` to a room the caller cannot access answers 400 `error-invalid-room`, the same as a room that does not exist, instead of 400 `error-not-allowed`.
- 403 bodies carry no `details` or `stack`.
- The DDP methods keep throwing their original error codes, except that adding a user without `access-federation` to a federated room now throws `error-not-authorized-federation` instead of an error whose code is the full message.
