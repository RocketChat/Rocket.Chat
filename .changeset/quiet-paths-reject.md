---
'@rocket.chat/meteor': patch
'@rocket.chat/rest-typings': patch
---

Fixes the importer reading arbitrary files from the server's filesystem. Imports from a URL now accept only HTTP and HTTPS URLs, import files are always read from inside the import store, and the "Server File Path" option was removed from the import page.
