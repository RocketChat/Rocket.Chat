---
'@rocket.chat/fuselage': minor
---

Renders the L2 indicator and surface components with Tamagui frames compiled to static CSS: `Throbber`, `ProgressBar`, `Divider`, `Tile`, `StatusBullet`, `Tooltip`, `ToastBar`, `Callout`, `Banner`, `Skeleton`, `CodeSnippet`, and `Avatar` with `AvatarContainer`, `AvatarStack` and `ChipThumb`. Their look is unchanged, with the exceptions listed below.

`Divider` gains `variation='medium'` (the navbar divider's thickness) and `Callout` gains `centered` (what the contact info panel did with a style override).

### Breaking for npm consumers

- `style` is no longer accepted by these components and no longer reaches their elements. The one exception is `Tooltip`, which takes the `style` of the `Position` that places it, typed as `position`, `top`, `left`, `bottom`, `zIndex`, `opacity`, `visibility` and `overflowY`. Props narrow to the attributes of the element each part renders, so an attribute outside that list no longer type-checks, and one passed anyway is not forwarded. This covers `Skeleton`, `CodeSnippet`, `Avatar`, `AvatarContainer`, `AvatarStack`, `Throbber`, `ProgressBar`, `Divider`, `Tile`, `StatusBullet`, `Tooltip`, `ToastBar`, `Callout` and `Banner`.
- `Tile`: it is no longer a `Scrollable`, `Position` or `AnimatedVisibility` child, so the props of those no longer reach it.
- `Avatar`: `objectFit` takes the five CSS values `contain`, `cover`, `fill`, `none` and `scale-down`. An `Avatar` with an `onClick` shows the pointer cursor.
- `Divider`: `variation='medium'` is new. A labelled divider no longer carries the `rcx-message-divider` class, and its `role` can no longer be overridden.
- `Callout`: `centered` is new, and the icon carries an `rcx-callout__icon--<type>` class, so a stylesheet that targeted the icon by the previous selector no longer matches.
- `ToastBar`: the `--toast-time` custom property is now `--rcx-toastbar-time`.
- `Throbber`: its custom properties are renamed to `--rcx-throbber-*` (`--rcx-throbber-size`, `--rcx-throbber-duration`, `--rcx-throbber-delay`).
- `StatusBullet`: the `icons/*` modules are removed; the bullets are drawn by the component itself.
- `Skeleton`: `width` and `height` are no longer `!important`, so a stylesheet can override them.
