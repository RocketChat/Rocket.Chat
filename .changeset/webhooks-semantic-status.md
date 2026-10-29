---
'@rocket.chat/meteor': major
---

**Breaking:** the `/hooks` endpoints answer with the status code that matches the failure instead of 400 for all of them.

- 403 when the integration user lacks `message-impersonate`, or when a `channel` or `roomId` override is disabled.
- 404 `error-invalid-room` when the destination room does not exist or the integration user cannot access it, so a private room is not revealed. It replaces 400 `invalid-channel` and 400 `error-not-allowed`.
- 404 from `/hooks/remove/...` when no integration matches `target_url`. The body is now `{ success: false, error: 'integration-not-found' }` instead of a 200 that wraps the failure.
- 500 when the integration script throws (`error-running-script`) or the message produces no result (`unknown-error`).
- Malformed payloads and errors returned by the script keep answering 400.
