---
'@rocket.chat/rest-typings': patch
'@rocket.chat/ddp-client': patch
'@rocket.chat/meteor': patch
---

Deduplicates REST route type declarations: routes whose migrated implementations already declare their types via `ExtractRoutesFromAPI` (chat, dm/im, e2e, emoji-custom, invites, push, roles, rooms, teams, and one omnichannel route) no longer carry a second hand-written declaration in `@rocket.chat/rest-typings`. Routes still registered through the legacy `API.v1.addRoute`, and routes whose extracted types are weaker than the hand-written ones or that standalone packages consume, stay declared in rest-typings and are omitted from the meteor augmentation. The ddp-client legacy SDK now carries local response contracts for the chat routes it calls. No runtime behavior changes.
