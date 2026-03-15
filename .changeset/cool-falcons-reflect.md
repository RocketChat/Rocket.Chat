---
'@rocket.chat/meteor': patch
'@rocket.chat/core-typings': patch
---

Fix user avatar real-time updates across the application

- Updated avatar broadcasting to include avatarETag
- Fixed message avatar updates when user changes avatar
- Added real-time avatar sync in UserProvider
- Updated SystemMessage and ThreadMessagePreview components
