---
'@rocket.chat/meteor': patch
---

Fixes incorrect message sender for incoming webhooks when "Post As" field is updated by ensuring both username and userId are synced to reflect the selected user.
