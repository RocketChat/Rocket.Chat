---
'@rocket.chat/fuselage-toastbar': patch
---

Fixed `ToastBarPortal` touching the DOM during render. It created and appended its anchor element while rendering, which threw during server-side rendering and left an empty `#toastBarRoot` behind whenever a render was discarded without committing. The anchor is now created after mount.
