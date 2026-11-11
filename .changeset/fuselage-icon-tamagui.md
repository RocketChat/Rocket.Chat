---
'@rocket.chat/fuselage': minor
---

Renders `Icon` with Tamagui instead of `Box`, so its look compiles to static CSS in the zero-runtime build.

**Breaking for npm consumers**

- `Icon` forwards a closed set of props: `name`, `size`, `color`, `role`, `id`, `title`, `className`, `ref`, every `aria-*` and `data-*` attribute, and the press and hover handlers (`onClick`, `onMouseEnter`, `onPointerDown`, `onFocus`…). It no longer accepts `style` or the other HTML attributes `HTMLAttributes` allowed.
- `size` is applied through the `--rcx-icon-size` custom property instead of a generated class. It takes the same values (`x16`, a number of pixels, a CSS length).
- The element is still an `i` with the classes `rcx-box rcx-box--full rcx-icon rcx-icon--name-<name>`; it also carries Tamagui's generated classes ahead of them.
- `Icon` is memoized: the default export's type is `MemoExoticComponent<typeof Icon>` instead of a plain function component, and `IconProps` is `GlyphAttributes & { name, size?, color?, role?, aria-hidden?, aria-label? }` instead of `ElementProps<HTMLElement> & { name, size?, color? }`.
