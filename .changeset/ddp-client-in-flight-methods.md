---
'@rocket.chat/ddp-client': patch
---

Fixes method calls hanging forever when the connection drops before their result arrives. They now reject with `ConnectionLostError`, and calls queued behind a lost `login` are sent after the reconnection instead of staying blocked.
