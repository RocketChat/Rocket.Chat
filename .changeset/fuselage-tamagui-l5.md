---
'@rocket.chat/fuselage': minor
---

Renders the L5 components with Tamagui frames compiled to static CSS: the `Sidebar` shell (`Sidebar`, `SidebarSection`, `SidebarFooter`, `SidebarBanner`, `SidebarMedia`, `SidebarAccordion` and `SidebarAccordionItem`), the `SidebarItem` family, `SidebarCollapseGroup` with its title and menu, the `NavBar` family and the `Sidepanel` family. Their look is unchanged, with the exceptions listed below.

`Item`, `ItemGroup`, `ItemGroupHeader`, `ItemGroupTitle`, `ItemDescription` and `ItemDivider` gain declared variations so the shell needs no overrides: `Item` takes `tone='link'` and `padding` (`default` or `large`), `ItemGroup` and `ItemGroupHeader` take `padding`, `ItemGroupTitle` takes `ring='border'`, `ItemDescription` takes `fill` and `ItemDivider` takes `variation='light'`. `NavBar` takes `compact`, and `SidebarItemAction` takes `selected`.

The accordion chevron of `SidebarAccordionItem` is always visible on a touch device, and the bar of an accordion item now stacks with the `sticky` layer instead of a literal `z-index: 1`. `SidebarLink`'s focus ring is now the `Item` ring (2px inset), as on sidebar rows. The `Sidepanel` header and list honour `--rcx-sidebar-color-stroke-extra-light` as the other dividers of the shell do.

### Breaking for npm consumers

- The per-part `unread` prop of `SidebarItemTitle`, `SidebarItemContent` and `SidebarItemTimestamp`, and the `highlighted` prop of `SidebarItemIcon`, are removed. Pass `highlighted` to the `SidebarItem` and its parts follow it.
- `Sidebar` no longer takes `collapsed`, and the rule that expanded a collapsed sidebar on hover is gone.
- `style` is no longer accepted by any Sidebar, NavBar or Sidepanel part, and no longer reaches their elements. Props narrow to the attributes of the element each part renders plus the variations it declares (`AllHTMLAttributes` and `HTMLAttributes` are gone from every shell part), so an attribute outside that list no longer type-checks, and one passed anyway is not forwarded. `NavBarItem` takes the props of `IconButton` and nothing else.
- `SidebarBanner`'s `linkProps` is narrowed to `href`, `target`, `rel`, `tabIndex`, `id`, `title` and `onClick`.
- `SidebarListItem` no longer takes `selected` (it only leaked a `selected` attribute onto the `div`).
- `SidepanelList` takes the props of `ItemGroup` without `is` and `padding`, and `SidepanelListItem` accepts the style Virtuoso gives its items.
- The classes of the parts stay (`rcx-sidebar-item`, `rcx-sidebar-collapse-group`, `rcx-navbar`, `rcx-sidepanel` and the rest), but their declarations come from frames, so custom CSS that depended on their specificity needs a review. The hooks `--rcx-sidebar-item-color-highlighted`, `--rcx-sidebar-color-surface-hover` on a group header and `--rcx-link-visited-color` / `--rcx-link-active-color` on `SidebarLink` are no longer read.
