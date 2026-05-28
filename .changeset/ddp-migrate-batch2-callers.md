---
'@rocket.chat/meteor': patch
---

Migrate seven client DDP callers to their REST equivalents (the DDP methods stay registered on the server for external SDK/mobile clients, with a deprecation log pointing at the REST route until 9.0.0 removes them):

- `loadMissedMessages` → `GET /v1/chat.syncMessages`
- `joinRoom` → `POST /v1/channels.join` (channel-only; non-`c` rooms now error via REST the same way they used to via DDP)
- `userSetUtcOffset` → `POST /v1/users.setPreferences` (new `utcOffset` field)
- `deleteFileMessage` → `POST /v1/chat.delete` (new `fileId` body shape)
- `readThreads` → `POST /v1/subscriptions.read` (new `tmid` field)
- `spotlight` → `GET /v1/spotlight` (new `usernames` / `type` / `rid` query params)
- `listCustomSounds` → `GET /v1/custom-sounds.list`
