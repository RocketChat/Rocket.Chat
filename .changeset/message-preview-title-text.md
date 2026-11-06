---
'@rocket.chat/fuselage': patch
---

Fix `MessageGenericPreviewTitle` rendering an empty title when it has no `externalUrl`, which hid the file name of attachments that cannot be downloaded
