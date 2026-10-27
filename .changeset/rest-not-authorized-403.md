---
'@rocket.chat/meteor': major
---

**Breaking:** REST refusals answer **403** with one body shape: `{ success: false, error: 'error-forbidden', errorType: '<code>' }`. `errorType` names the check that refused the request (`error-not-authorized`, `error-not-allowed`, `not-authorized`, `error-forbidden`…).

- `error-not-allowed` and the unprefixed `not-authorized` now answer 403 instead of 400, whether the endpoint throws them as a Rocket.Chat error or as a plain `Error` whose message is the code. This covers, among others, `chat.pinMessage`, `chat.unPinMessage`, `chat.starMessage`, `chat.unStarMessage`, `chat.react`, the thread and message endpoints refused by settings or room access, `rooms.info` and `rooms.getDiscussions` without room access, `chat.delete` with `asUser` without `force-delete-message`, `statistics`, integrations, and `users.generatePersonalAccessToken`, `users.regeneratePersonalAccessToken` and `users.removePersonalAccessToken`.
- `error` no longer carries the reason (`User does not have the permissions required for this action [error-unauthorized]`, `Not authorized [error-not-authorized]`, `forbidden`, …): it is always `error-forbidden`, and clients read the code from `errorType`. Permission checks declared on the route report `errorType: 'error-not-authorized'`.
- 403 bodies carry no `details` or `stack`.
- `commands.run` and `commands.preview` report the original code in `errorType` instead of rewriting it to `error-forbidden`.
