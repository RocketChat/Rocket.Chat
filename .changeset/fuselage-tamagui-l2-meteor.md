---
'@rocket.chat/meteor': patch
---

Moves the call sites of the L2 indicator components off the styling props they no longer take. Two class contracts change for anyone styling the client with custom CSS: a labelled `Divider` no longer carries `rcx-message-divider`, and the `Callout` icon carries a modifier class for its type.
