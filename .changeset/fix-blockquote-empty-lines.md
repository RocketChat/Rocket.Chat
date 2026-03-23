---
'@rocket.chat/message-parser': patch
---

Fixed blockquotes with empty lines between paragraphs not rendering as a single blockquote. Lines like `> ` or `>` (empty quote lines) are now treated as part of the surrounding blockquote rather than breaking it into separate quotes.
