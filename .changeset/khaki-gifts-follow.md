---
"@rocket.chat/meteor": minor
"@rocket.chat/abac": minor
---

Allows using Virtru as the attribute store for ABAC decisions.

### Important

- When using virtru as the store, the internal attribute store is disabled.
- On switch, existing ABAC attributes from rooms will be removed. Rooms will continue to be private & no users will be removed until you add attributes again.
- Users are only allowed to see & edit rooms they have access to. Access decision is evaluated on Virtru
- A user/app with the `bypass-abac-store-validation` permission can assign any attributes to rooms, even if the user doesn't have them assigned on Virtru.
