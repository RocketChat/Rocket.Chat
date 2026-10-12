---
'@rocket.chat/abac': minor
'@rocket.chat/core-services': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Makes `/invite-all-to` and `/invite-all-from` add only the members an ABAC-managed room allows and name the ones they skipped, instead of failing on the first member the room refuses. A room locked by ABAC enforcement is refused with `error-abac-room-locked`, and when no access decision can be made the command is refused with `error-abac-decision-unavailable`; in both cases nobody is added.
