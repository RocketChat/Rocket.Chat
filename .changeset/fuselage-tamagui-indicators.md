---
'@rocket.chat/fuselage': minor
---

Renders `Throbber`, `ProgressBar`, `Skeleton`, `StatusBullet`, `Divider`, `CodeSnippet` and `Callout` with Tamagui frames, each with a platform-neutral contract.

**Breaking for npm consumers**

- These components accept only the props they declare, plus `id`, `className`, `data-*`, the `aria-*` attributes of their role, `ref` and, where it is not a prop of its own, `title`. `style`, DOM event handlers and any other HTML attribute are no longer forwarded.
- `Throbber`: `size` is one of `x8`, `x12`, `x16`, `x20`, `x24`, `x32` and `x40` instead of any Box size.
- `Skeleton`: `style` is no longer accepted; size it with `width` and `height`.
- `Divider`: `variation` gains `medium`. `NavBarDivider` uses it.
- `CodeSnippet` and `Callout`: `onPress` is the press handler. `onClick` still works on the web and is deprecated.
- The `rcx-*` classes of these components no longer carry their styles, and these theme hooks are no longer read: `--rcx-progress-bar-border-radius`, `--rcx-progress-bar-color-shine`, `--rcx-progress-bar-color-background`, `--rcx-divider-size`, `--rcx-divider-color`, `--rcx-code-snippet-border-radius`, `--rcx-callout-*`, and the `--throbber-duration` and `--throbber-delay` properties. Custom CSS that targets them stops applying.
- `CodeSnippet`: the gap between the code and the button follows the text direction.
