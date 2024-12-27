---
"@rocket.chat/meteor": patch
---

Removes a validation that allowed only the room creator to propagate E2EE room keys. This was causing issues when the rooms were created via apps or some other integration, as the creator may not be online or able to create E2EE keys
