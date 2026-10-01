---
'@rocket.chat/meteor': patch
'@rocket.chat/rest-typings': patch
---

Fixes `downloadPublicImportFile` reading arbitrary files from the server's filesystem. Imports from a URL now accept only HTTP and HTTPS URLs, and the "Server File Path" option was removed from the import page.
