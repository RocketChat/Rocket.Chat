---
'@rocket.chat/fuselage': minor
---

Renders the shell components with Tamagui frames compiled to static CSS: the `NavBar` and `NavBarSection`, the `Sidebar` root with `SidebarSection`, `SidebarFooter`, `SidebarFooterContent`, `SidebarMedia`, `SidebarMediaTitle`, `SidebarMediaController`, `SidebarBanner`, `SidebarBannerLink` and `SidebarBannerButton`, `SidebarAccordion` and `SidebarAccordionItem`, and `Sidepanel`, `SidepanelHeader`, `SidepanelHeaderTitle` and `SidepanelSection`. Their colors are theme keys and their spacing is tokens of the Tamagui config, so a palette written by `PaletteStyleTag` on a region reaches them. `NavBar` gains `compact`, which narrows its inline padding.

Visible changes: the chevron of a `SidebarAccordionItem` appears on hover only where the device can hover, so a touch tap no longer reveals it (it still appears on keyboard focus).

### Breaking for npm consumers

- `style` is no longer accepted by any of these parts and no longer reaches their elements.
- Their props are each part's contract plus a typed set of web attributes: `id`, `className`, `title`, `role`, `tabIndex`, `ref`, every `aria-*` and `data-*` attribute, `onClick` and the pointer, focus and keyboard handlers. Any other attribute no longer type-checks and is not forwarded. `SidebarAccordionItem` forwards `tabIndex` to its bar, as before, and takes no HTML `title`.
- `Sidebar` no longer takes `collapsed`, and the rules that hid the banner content, the media title and the footer of a collapsed sidebar until it was hovered are gone.
- `SidebarBanner`, `SidebarBannerLink` and `SidebarBannerButton` take `onPress`; `onClick` still works and is deprecated. `SidebarBannerLink` forwards `href`, `target`, `rel` and `download`, and `SidebarBannerButton` forwards `name`, `value` and `disabled`.
- The per-component theme hooks are no longer read: `--rcx-sidebar-color-surface-default` and `--rcx-sidebar-color-font-default` on the sidebar root and the accordion bar, `--rcx-sidebar-accordion-border-color`, `--rcx-sidebar-media-color`, `--rcx-sidebar-media-border-color`, the `--rcx-sidebar-banner-background-*` and `--rcx-sidebar-banner-color-*` families, and `--rcx-link-*` on `SidebarBannerButton`. Write the palette on the region with `PaletteStyleTag` instead.
- The `rcx-*` classes of these parts stay on their elements but are not an API: their declarations now come from the frames, so custom CSS that overrode them by specificity needs a review. The chevron class `rcx-sidebar-accordion-item__chevron` is now on a `span` around the chevron.
