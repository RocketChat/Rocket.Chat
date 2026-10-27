---
'@rocket.chat/ui-kit': minor
'@rocket.chat/fuselage-ui-kit': patch
'@rocket.chat/meteor': patch
---

Fixes UiKit `callout` blocks not rendering in banners and in messages. Each UiKit surface now has a single list of accepted layout blocks, exported by `@rocket.chat/ui-kit` (`messageSurfaceLayoutBlockTypes`, `modalSurfaceLayoutBlockTypes`, `bannerSurfaceLayoutBlockTypes`, `contextualBarSurfaceLayoutBlockTypes`, `attachmentSurfaceLayoutBlockTypes`) and shared by the surface types, the `UiKitParser*` classes and the Fuselage renderers. The surface types now also include every block the web client already rendered: `input` and `info_card` in messages, `preview` in modals, `preview` and `info_card` in banners, and `callout`, `preview` and `tab_navigation` in the contextual bar.
