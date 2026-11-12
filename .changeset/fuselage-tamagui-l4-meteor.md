---
'@rocket.chat/meteor': patch
---

Moves `GenericCard`, which sizes the home and upgrade cards, off the `width` and `height` props `Card` no longer takes, and types the dialog ref of two modals as the `dialog` it is. Class changes for anyone styling the client with custom CSS: the cards of a card group no longer carry `rcx-card-group__item`, and the group spaces them with `gap`. A bubble group (jump to recent messages, unread) now rounds its outer corners by reading direction in right-to-left layouts.
