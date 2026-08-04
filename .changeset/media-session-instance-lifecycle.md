---
'@rocket.chat/ui-voip': patch
'@rocket.chat/meteor': patch
---

Fixes the media call session being ended and recreated on re-renders, which could drop an ongoing call, and makes ICE server and ICE gathering timeout changes apply to new calls without recreating the session
