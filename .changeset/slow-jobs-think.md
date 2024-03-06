---
"@rocket.chat/meteor": patch
---

fix: CRM integration mismatch on callback type vs code validation. Previously, callback was attempting to register a `LivechatStarted` event, however, our internal code was expecting a `LivechatStart` event, causing the hook to receive incomplete data
