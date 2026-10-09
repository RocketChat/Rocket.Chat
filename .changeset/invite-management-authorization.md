---
'@rocket.chat/meteor': major
---

Requires the new global `manage-invite-links` permission to list or remove workspace-wide invite links and access the admin invites page. New and upgraded workspaces grant this permission to admins only; existing `create-invite-links` assignments remain unchanged. Invite creation still requires permission for the target room and room membership, and cannot be used by banned members or users who no longer have room access.
