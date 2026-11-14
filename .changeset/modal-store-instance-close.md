---
'@rocket.chat/ui-client': patch
'@rocket.chat/meteor': patch
---

Fixes closing a modal through the handle returned when it opened: it closed whatever modal was on top instead of its own, so an app's modal closing late could dismiss a modal opened after it.
