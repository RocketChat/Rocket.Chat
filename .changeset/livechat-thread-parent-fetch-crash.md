---
'@rocket.chat/livechat': patch
---

Fixes the Livechat widget crashing while loading a thread reply whose parent message can't be fetched (for example after a network failure or when the parent was deleted). The widget now renders the reply without its quoted-parent context instead of throwing.
