---
'@rocket.chat/fuselage': minor
---

Adds `ToastBarSurface`, `ToastBarIcon`, `ToastBarMessage`, `ToastBarClose` and `ToastBarProgress`, the parts `ToastBar` is now built from. They render on `Item`, so a toast can hold other content, such as an avatar and a link, and still look like a toast. `ToastBar` keeps its props and markup classes: `rcx-toastbar`, `rcx-toastbar--{variant}` and `rcx-toastbar_progressbar(--paused)` stay on the same elements.

Visual changes to `ToastBar`:

- The inline padding is 12px instead of 16px, and the gaps between the icon, the message and the close button are 4px instead of 16px.
- On touch screens (`pointer: coarse`) the block padding is 8px instead of 16px.
- The toast no longer turns on `tabular-nums` and font smoothing for its content.

### Breaking for npm consumers

- The inner `rcx-toastbar_inner`, `rcx-toastbar_content`, `rcx-toastbar_icon--{variant}` and `rcx-toastbar-close` classes are gone.
- The `--rcx-toastbar-color` theme variable is no longer read; the text color comes from `--rcx-item-color-font-default`.
