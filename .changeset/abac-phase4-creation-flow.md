---
'@rocket.chat/abac': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/core-services': minor
'@rocket.chat/meteor': minor
'@rocket.chat/i18n': minor
---

Reworks Create channel into a four-step flow when the room will be ABAC-managed, keeping the existing single-page flow when it will not. Step 1 carries the channel details and an ABAC-managed toggle that forces Private on (and is itself locked on while workspace enforcement is enabled); step 2 selects room attributes with the workspace-required ones pre-filled and non-removable; step 3 holds the existing security and permissions controls; step 4 previews which invited members are compliant, and blocks creation when none are.

Adds the single member-evaluation function behind that preview, shared with the attribute-editing surfaces: one batched policy round trip for N members rather than one per member, server-side pagination, exact counts above a threshold where enumerating members would not be useful, and a separate report for members the policy decision point did not answer for — so an unanswered decision is never shown as retained access.

A PDP denial now names the attribute and values it refused instead of failing generically, and is raised before anything is created. "Assign only attributes you possess" is now enforced for the local policy decision point, which previously ignored the acting user entirely.
