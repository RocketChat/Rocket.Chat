---
"@rocket.chat/meteor": major
---

Adds a new set of permissions to provide a more granular control for the creation and deletion of rooms within teams
 - `create-team-channel`: controls the creations of public rooms within teams, it is checked within the team's main room scope and overrides the global `create-c` permission check. That is, granting this permission to a role allows users to create channels in teams even if they do not have the permission to create channels globally;
 - `create-team-group`: controls the creations of private rooms within teams, it is checked within the team's main room scope and overrides the global `create-p` permission check. That is, granting this permission to a role allows users to create groups in teams even if they do not have the permission to create groups globally;
 - `delete-team-channel`: controls the deletion of public rooms within teams, it is checked within the team's main room scope and complements the global `delete-c` permission check. That is, users must have both permissions (`delete-c` in the channel scope and `delete-team-channel` in its team scope) in order to be able to delete a channel in a team;
 - `delete-team-group`: controls the deletion of private rooms within teams, it is checked within the team's main room scope and complements the global `delete-p` permission check. That is, users must have both permissions (`delete-p` in the group scope and `delete-team-group` in its team scope) in order to be able to delete a group in a team;;

Renames `add-team-channel` permission (used for adding existing rooms to teams) to `move-room-to-team`, since it is applied to groups and channels.