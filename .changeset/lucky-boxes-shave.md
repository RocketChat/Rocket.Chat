---
"@rocket.chat/meteor": patch
---

Fixes the message list often not scrolling to the bottom after you send a message. The scroll was triggered by the server's echo of the message, which is skipped whenever the response to the send is processed first — the message is then no longer recognised as new and nothing tells the list to move. It now scrolls as soon as the message is appended locally, so it no longer waits for the round-trip.
