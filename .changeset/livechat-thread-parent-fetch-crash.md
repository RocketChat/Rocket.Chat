---
'@rocket.chat/livechat': patch
---

Fixes the Livechat widget's handling of thread replies whose parent message is fetched from the server: the response envelope was used as the message itself, so quoted-parent context rendered empty (`text: undefined`), and a failed fetch threw instead of degrading gracefully. The widget now unwraps the parent message correctly and renders the reply without quoted context (instead of throwing) when the parent can't be loaded.
