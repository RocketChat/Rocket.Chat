---
'@rocket.chat/meteor': minor
---

Keeps files attached in the message composer when you leave a room or thread and come back, so they no longer have to be uploaded again. Files that are still uploading when you leave are kept once they finish. Kept files are discarded after a day, when the server removes uploads that were never sent. In the browser, leaving or reloading the page while a file is still uploading now asks for confirmation first; the desktop app does not ask.
