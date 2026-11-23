---
'@rocket.chat/fuselage': minor
---

`Tag` takes `is='button'` to render a `<button type='button'>` that keeps the tag's look, for a tag that acts, such as a filter toggled with `aria-pressed`. Without `is`, it still renders `a` with `href` and `span` otherwise. A disabled `Tag` now keeps the secondary background and dims its text with the disabled secondary button's font colour, instead of its own neutral surface. `SidebarCollapseGroup` now renders its `actions` right after the group title, outside the button that collapses the group, with the menu at the end of the header. `MenuSubmenuTrigger` takes react-stately's selection props (`selectionMode`, `selectedKeys`, `defaultSelectedKeys`, `onSelectionChange`, `disallowEmptySelection`) and `disabledKeys` for the submenu it opens, so its items can be radio or checkbox items that announce which one is checked, and some of them can be disabled.
