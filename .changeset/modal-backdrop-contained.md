---
'@rocket.chat/fuselage': minor
'@rocket.chat/meteor': patch
---

Adds `ModalBackdrop` `contained`, which covers its positioned container instead of the viewport. The thread view uses it instead of overriding the backdrop's `position`, and states its own inline-start border instead of taking it from the `rcx-vertical-bar` class, which it keeps as a marker.
