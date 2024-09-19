---
'@rocket.chat/rest-typings': patch
'@rocket.chat/meteor': patch
---

Fixed issue of UI crashing when trying to remove a team member which wasn't part of any team-rooms. The UI was crashing due to unhandled undefined value of a prop. Also migrated this UI flow to Typescript.
