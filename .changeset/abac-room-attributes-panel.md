---
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds an **Attribute-based access control** panel to private rooms and teams, opened from the room toolbar by users with the **Edit room ABAC attributes** permission in that room, or with both ABAC administration permissions. It shows only in a room that carries ABAC attributes or is locked by ABAC enforcement. The panel lists the room's attributes and marks every required attribute the room lacks as **Not set**. **Manage attributes** opens a form where required attributes are listed first and cannot be removed, other attributes can be added or removed, and **Review changes** leads to the **Members (preview)** step before anything is saved. An editor whose own change removes them from the room is taken back to the home page. The message shown in place of the composer of a locked private room now reads "Channel locked. Required ABAC room attributes missing.", or "Team locked." for a team, and offers **Manage attributes** to users who can unlock it.
