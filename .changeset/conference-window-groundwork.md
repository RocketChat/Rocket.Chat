---
'@rocket.chat/fuselage-ui-kit': minor
'@rocket.chat/mock-providers': minor
'@rocket.chat/desktop-api': minor
'@rocket.chat/ui-client': minor
'@rocket.chat/ui-kit': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': patch
---

Adds the views, hooks and shared-package plumbing behind the persistent video conference window, as groundwork for the feature that will use them.

Nothing here is mounted into the application: no new item appears in the navigation bar, the room header, the room list or the message list, and no existing screen renders anything it did not render before. The conference window itself is only reached by visiting a `/conference/...` URL directly, a route that already existed and until now rendered a placeholder. `UserAction.addStream` now reference-counts its subscribers instead of throwing when a room is already streaming, so a room can be mounted twice; `AuthenticationCheck` and `UsernameCheck` accept a `loading` placeholder so a standalone route can avoid flashing the app-shaped skeleton; and `GenericMenuItem` accepts a `textValue` so a menu item with rendered content can still be announced and matched by typeahead.
