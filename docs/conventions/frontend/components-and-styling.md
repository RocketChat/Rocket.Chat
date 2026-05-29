# Convention: components & styling (Fuselage)

**Who this is for:** a developer building UI. **After reading:** you reach for
the design system first and know the styling rules.

---

## Use Fuselage, don't reinvent

Rocket.Chat's design system is **Fuselage** (`@rocket.chat/fuselage` and friends).
Before writing a new component or raw markup:

1. Use a **Fuselage** component (`Box`, `Button`, `Field`, `Modal`, `Table`,
   `Tabs`, …).
2. For app-specific composites, check `@rocket.chat/ui-client` and
   `@rocket.chat/fuselage-ui-kit` (UIKit blocks).
3. Hooks: `@rocket.chat/fuselage-hooks` (`useDebouncedValue`,
   `useMutableCallback`, `useUniqueId`, …).
4. Icons: `@rocket.chat/icons` via Fuselage's `<Icon />`.

Only build a bespoke component when nothing fits — and put it at the right level
(see [folder-structure](./folder-structure.md)).

## Styling

- Prefer **Fuselage `Box` props / design tokens** over hand-written CSS. `Box`
  takes spacing/color/layout props backed by `@rocket.chat/fuselage-tokens`.
- Avoid raw `.css` for component styling. Existing CSS is linted
  (`yarn stylelint`); don't add hardcoded colors/sizes — use tokens.
- Theming (light/dark) comes from Fuselage + `ui-theming`; don't hardcode colors
  that break a theme.

## Markdown / message rendering

User-generated message content is rendered by **`@rocket.chat/gazzodown`** (with
`@rocket.chat/message-parser`). Don't roll your own markdown rendering for
messages.

## Accessibility

Fuselage components ship a11y behavior (focus, ARIA). When composing, keep
labels/roles — don't strip them. The project pins `react-aria` (patched); rely
on it rather than manual key handling where a Fuselage component exists.

---

**Next:** [data-fetching](./data-fetching.md) ·
[contexts-and-hooks](./contexts-and-hooks.md)
