---
'@rocket.chat/meteor': patch
---

Fixed the message list loading the entire room history while it is hidden behind a full-width contextual bar. On a narrow window the room layout hides the message body, and a hidden element reports its height and scroll offset as `0`, which made the load-older-messages check always true - so every page that arrived triggered the next one until the whole room was in memory, hammering the server until it rate-limited the client. On returning to the list the scroll position was far in the past, because the content had grown underneath it.
