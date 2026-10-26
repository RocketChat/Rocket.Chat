---
'@rocket.chat/fuselage': patch
---

Lets the props passed to `ContextualbarIcon`, `ContextualbarAction` and `ModalClose` override their defaults (`size`, `small`, `icon`), which were applied after the props and silently won.
