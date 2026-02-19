---
'@rocket.chat/meteor': patch
---

Fixed a DOMPurify memory leak in MarkdownText by moving hook registration to a singleton pattern.
