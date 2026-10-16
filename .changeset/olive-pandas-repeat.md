---
'@rocket.chat/meteor': patch
---

Fixed the custom fields section of the omnichannel room and contact edit forms not appearing until the panel was reopened. Both forms asked for the permission through a helper that does not re-render React when permissions finish loading or change, so the section could stay hidden for the rest of the panel's life.
