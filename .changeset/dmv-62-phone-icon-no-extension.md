---
"@rocket.chat/meteor": patch
---

Fixed the voice-call phone icon being shown in direct messages with users that have no phone extension assigned. When internal calls are routed through SIP, the call action is now only offered if the other user has an extension; with SIP routing disabled the action keeps showing as before.
