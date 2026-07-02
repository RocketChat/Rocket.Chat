---
'@rocket.chat/meteor': patch
---

Migrate the thread read-marker client callers from the `readThreads` DDP method to `POST /v1/subscriptions.read` (now with the `tmid` field). The DDP method stays registered on the server for external SDK/mobile clients, with a deprecation log pointing at the REST route until 9.0.0 removes it.

- `ThreadChat.tsx`
- `useThreadMessagesQuery.ts`
