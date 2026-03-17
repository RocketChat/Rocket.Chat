---
'@rocket.chat/meteor': patch
---

Fixes a cross-resource access issue that allowed users to retrieve emojis from the Custom Sounds endpoint and sounds from the Custom Emojis endpoint when using the FileSystem storage mode.
