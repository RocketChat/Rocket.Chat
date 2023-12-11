---
"@rocket.chat/meteor": major
---

Added permissions to provide a more granular control for the creation and deletion of rooms within teams
 - `create-team-channel`: controls the creations of public rooms within teams, it is checked within the team's main room scope and overrides the global `create-c` permission check;
 - `create-team-group`: controls the creations of private rooms within teams, it is checked within the team's main room scope and overrides the global `create-c` permission check;
 - `delete-team-channel`: controls the deletion of public rooms within teams, it is checked within the team's main room scope and complements the global `delete-c` permission check;
 - `delete-team-group`: controls the deletion of private rooms within teams, it is checked within the team's main room scope and complements the global `delete-p` permission check;
