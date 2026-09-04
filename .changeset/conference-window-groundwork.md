---
'@rocket.chat/fuselage-ui-kit': patch
'@rocket.chat/mock-providers': patch
'@rocket.chat/desktop-api': patch
'@rocket.chat/ui-client': patch
'@rocket.chat/ui-kit': patch
'@rocket.chat/i18n': patch
'@rocket.chat/meteor': patch
---

Groundwork for the video conference window: no user-facing change.

Adds the window's views and hooks, an ongoing-calls list, and the small shared-package additions they need. None of it is mounted into the application — no item appears in the navigation bar, the room header, the room list or the message list, no existing screen renders anything new, and no new request, poll or subscription starts. The window is reachable only by visiting a `/conference/...` URL directly, a route that already existed and until now rendered a placeholder. The feature that mounts all of this arrives separately, behind a setting that is off by default.

Three shared behaviours changed along the way: `UserAction.addStream` reference-counts its subscribers instead of throwing when a room is already streaming, so the same room can be mounted twice; `AuthenticationCheck` and `UsernameCheck` accept a `loading` placeholder so a standalone route need not flash the app-shaped skeleton; and `GenericMenuItem` accepts a `textValue` so a menu item with rendered content is still announced and matched by typeahead.
