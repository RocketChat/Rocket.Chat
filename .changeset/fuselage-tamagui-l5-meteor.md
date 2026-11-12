---
'@rocket.chat/meteor': patch
---

Moves the side panel, the navigation bar and the room list rows to the Fuselage Sidebar, NavBar and Sidepanel parts that no longer take `style`, `unread` on a row's parts or `Sidebar collapsed`. Class changes for anyone styling the client with custom CSS: the sidebar, side panel, navigation bar and room list rows keep their `rcx-*` classes, but the declarations come from frames, so rules that relied on their specificity need a review, and the custom properties `--rcx-sidebar-item-color-highlighted`, `--rcx-sidebar-color-surface-hover` (on a group header) and `--rcx-link-visited-color` / `--rcx-link-active-color` (on sidebar links) no longer have an effect. The side panel now honours `--rcx-sidebar-color-stroke-extra-light` for its dividers.
