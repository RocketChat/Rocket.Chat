---
'@rocket.chat/message-parser': patch
---

Fixes a `#` inside a word, such as `"#team.dev"`, turning the rest of the name into a link to the wrong address
