---
'@rocket.chat/meteor': patch
---

Fixes team deletion failing when the team's main room no longer exists. Such teams were left orphaned: hidden from the admin UI, still reserving their name, and impossible to remove through any supported path. Deleting a team now completes even when its main room is already gone, so a deletion interrupted midway can be finished by simply retrying it, and the team name becomes available again.
