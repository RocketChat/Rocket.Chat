---
'@rocket.chat/ui-kit': patch
'@rocket.chat/meteor': patch
---

Fixes apps not being able to close a UiKit modal with a `modal.close` response; the client now closes the modal named by the response's `view.id` or `viewId`.
