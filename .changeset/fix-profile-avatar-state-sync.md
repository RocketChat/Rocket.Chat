---
"@rocket.chat/meteor": patch
---

Fix profile avatar editor state inconsistencies after cancel, save, and reset cycles.

Re-uploading the same file after cancelling no longer silently fails (the file input is now reset between selections so the change event always fires). The avatar editor's local preview is now cleared in sync with form-level resets, so cancelling restores the user's saved avatar and saving no longer leaves a stale preview behind. The reset preview URL also includes the user's etag so it busts the browser cache when the saved avatar actually changes.
