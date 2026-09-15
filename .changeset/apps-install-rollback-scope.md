---
'@rocket.chat/meteor': patch
---

Fixes the clean up of a failed app installation. The server now reverts the installation steps in reverse order and one at a time, it keeps an app user that the installation did not create, and a failed clean up step no longer stops the remaining steps or hides the original error. The server also compiles the app package before it writes anything, so a package that it can not compile leaves no data behind.
