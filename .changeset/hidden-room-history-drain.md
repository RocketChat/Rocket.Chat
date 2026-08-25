---
'@rocket.chat/meteor': patch
---

Fixes the message list silently loading the entire room history — and downloading its attachments — in the background when a full-width contextual bar (such as the thread view on small screens) hides it
