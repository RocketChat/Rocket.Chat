---
'@rocket.chat/meteor': major
'@rocket.chat/core-typings': major
'@rocket.chat/model-typings': major
'@rocket.chat/models': major
---

- Requires `manage-invite-links` (admins by default) for global invite listing, removal, and admin access. Creation remains room-scoped.
- Separates secure invite tokens from record IDs and removes tokens and URLs from listings. Integrations must share `inviteToken` or `url`, not `_id`.
- Preserves legacy URLs and limits, but expires never-expiring legacy links after 90 days. Migrated invites receive new record IDs for removal. Stop all older application instances before running the upgrade migration.
