---
'@rocket.chat/meteor': patch
---

Fixes users being set back to online after a websocket reconnection (connection drop, network change, server restart) even though they had gone idle and never interacted with the UI again. The client now tracks the last UI interaction across connection drops and restates the away status as soon as the reconnected session is authenticated, instead of assuming the new session is online and restarting the idle countdown from scratch.
