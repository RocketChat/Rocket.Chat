---
'@rocket.chat/fuselage': minor
'@rocket.chat/meteor': patch
'@rocket.chat/ui-client': patch
'@rocket.chat/ui-conference': patch
---

Renders `Item` and its parts (`ItemGroup`, `ItemGroupHeader`, `ItemGroupTitle`, `ItemContent`, `ItemRow`, `ItemMedia`, `ItemIcon`, `ItemTitle`, `ItemDescription`, `ItemMeta`, `ItemLink`, `ItemActions`, `ItemDivider`, `ItemDragHandle`, `ItemDropSlot`) with Tamagui frames compiled to static CSS. The rows built on them (messages, sidebar and side panel rows, options, menu items) look the same.

### Breaking for npm consumers

- `is` is a closed set of tags per part: `Item` `div`, `li`, `a`, `label`; `ItemGroup` `div`, `ul`, `ol`; `ItemGroupHeader`, `ItemDivider`, `ItemDropSlot` `div`, `li`; `ItemGroupTitle` `div`, `button`, `h2`, `h3`, `h4`; `ItemTitle` `div`, `span`, `label`; `ItemDescription`, `ItemMeta` `div`, `span`; `ItemLink` `a`, `button`. `ItemContent`, `ItemRow`, `ItemMedia`, `ItemIcon`, `ItemActions` and `ItemDragHandle` no longer take `is`.
- Each part takes a neutral contract (`children`, `role`, the ARIA states of a button or a link, `testID`, `ref`, `onPress`) plus, on the web, `id`, `className`, `title`, `tabIndex`, `data-*` and the pointer, keyboard and focus handlers. `Item` also takes `href`, `target`, `rel`, `download`, `value`, `onPointerMove`, `onClickCapture` and `onDragStartCapture`; `ItemLink` takes the attributes of its `a` or its `button`; `ItemTitle` takes `htmlFor`. Any other HTML attribute no longer type-checks and is not forwarded. The same holds for the message, sidebar, side panel and option parts that render an `Item` part: they now take that part's props.
- `onPress` is the press; `onClick` still works and is deprecated.
- `style` is no longer accepted. The one exception is `ItemGroup`, which takes the offsets a virtualizer gives the list it renders (`boxSizing`, `marginTop`, `paddingTop`, `paddingBottom`, `visibility`) and drops any other key.
- A row that holds an `ItemLink`, a button or any other target no longer finds it by itself: pass `interactive` to get the hover surface. A row with `onPress`, a row rendered as `a`, an option and a menu item still react without it.
- A row counts the lines of the `ItemContent` among its children; content rendered by another component reports itself after the first render. Pass `multiline` to a row whose content is behind another component to skip that second render.
- `ItemActions reveal='hover'` stay shown while the focus is inside something they opened, such as a menu, instead of while a descendant has `aria-expanded='true'`.
- Two `ItemGroup` next to each other no longer get a margin between them: space them with the `gap` of the element that holds them.
- `.rcx-item-drag-preview` goes on an element around the copy of the dragged row, not on the copy.
- The `--rcx-item-*` custom properties are gone: the theme hooks (`--rcx-item-color-*`, `--rcx-item-group-*`, `--rcx-item-drag-preview-color-surface`) and the layout inputs (`--rcx-item-gap`, `--rcx-item-inset-inline`). A class that sets a property a part's frame sets no longer applies; use a variation.
- New variations: `Item editing`, `ItemRow fixedHeight`, `ItemMedia variant='slot'`, `ItemActions justify`, `ItemGroupHeader interactive`, `ItemGroup hidden`.
