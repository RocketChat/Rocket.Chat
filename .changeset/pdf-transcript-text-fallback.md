---
'@rocket.chat/pdf-worker': patch
---

Fixes livechat transcript PDFs leaving out the text of messages that contain formatting the PDF cannot draw, such as quotes, tables, task lists, nested lists or timestamps; those messages now show their original text
