---
'@rocket.chat/fuselage': minor
---

`SidebarBanner` takes its action as children: `SidebarBannerLink` when it navigates, `SidebarBannerButton` when it runs code, so the action can be reached and activated from the keyboard.

Breaking for npm consumers: `linkText` and `linkProps` are removed; pass a `SidebarBannerLink` as a child instead.
