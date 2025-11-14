---
"@rocket.chat/ui-voip": patch
---

Fixes an issue in the voice call peer selection field (on the widget and transfer modal) by filtering out the current peer and users that do not have an extension assigned, in case of forced SIP routing.
