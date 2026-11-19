---
'@rocket.chat/meteor': minor
---

Keeps files attached in the message composer when you leave a room or thread and come back, so they no longer have to be uploaded again. Files that are still uploading when you leave are kept once they finish. Kept files are discarded after a day, when the server removes uploads that were never sent. In the browser, leaving or reloading the page while a file is still uploading now asks for confirmation first; the desktop app does not ask. Kept files are forgotten when you log out, and on workspaces that forget the user session when the window closes they last only as long as the window.
