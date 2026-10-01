---
'@rocket.chat/meteor': patch
---

Fixed the **Encrypted** toggle being ignored when creating a discussion from an unencrypted parent room. The `encrypted` flag selected in the Create Discussion dialog was not sent to the API, so the discussion was created unencrypted even though the user explicitly enabled encryption.
