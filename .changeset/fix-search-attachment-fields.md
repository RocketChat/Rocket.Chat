---
'@rocket.chat/meteor': patch
---

Fix: Message search now includes attachment text fields (text, title, description, pretext, author_name) in the MongoDB text index so searching works on post attachments, not just message body.
