---
'@rocket.chat/core-typings': patch
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes the Slack importer storing shared files as raw URLs in the message body. Imported file messages now stay hidden until "Download Pending Files" button fetches them, then display as native attachments with image previews. Failed downloads (e.g. invalidated export links) are no longer silently saved as the file's content — they are counted as errors and can be retried.
