---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

`GET /v1/spotlight` now mirrors the DDP `spotlight` method:

- accepts optional `usernames` (comma-separated string), `type` (JSON-encoded `{ users?, mentions?, rooms?, includeFederatedRooms? }`) and `rid` query params;
- response items expose `nickname` / `outside` (users) and `uids` / `usernames` / `fname` (rooms);
- `status` on each user is now optional — outside/federated users were already being returned without one and the previous required-field schema rejected them as `Response validation failed`;
- the endpoint is no longer auth-gated, allowing anonymous-read flows (e.g. `Accounts_AllowAnonymousRead`) to keep finding public channels through the navbar search.
