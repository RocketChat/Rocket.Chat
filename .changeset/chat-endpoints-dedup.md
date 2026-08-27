---
'@rocket.chat/rest-typings': patch
'@rocket.chat/ddp-client': patch
'@rocket.chat/fuselage-ui-kit': patch
'@rocket.chat/meteor': patch
---

Deduplicates REST route type declarations: every route whose migrated implementation declares its types via `ExtractRoutesFromAPI` (chat, dm/im, e2e, emoji-custom, invites, push, roles, rooms, teams, and one omnichannel route) no longer carries a second hand-written declaration in `@rocket.chat/rest-typings` — the augmentation is authoritative. Standalone route registrations are captured into the extracted types, and previously weak extractions were strengthened at the source (typed response generics, query validators). Only routes still registered through the legacy `API.v1.addRoute` stay declared in rest-typings. Standalone packages that consume migrated routes without the meteor augmentation (ddp-client SDKs, fuselage-ui-kit) carry their own minimal local contracts mirroring the server responses. No runtime behavior changes, except that `GET /v1/rooms.info` and `GET /v1/emoji-custom.all` now validate their query params (permissively, matching what the handlers already accepted).
