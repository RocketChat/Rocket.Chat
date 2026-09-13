---
'@rocket.chat/meteor': patch
---

Fixes the retention policy warning message omitting the message age when the retention TTL settings are set through environment variables.

Workspaces that already used those environment variables should be aware that the incorrect value was persisted to the database, and upgrading does not rewrite stored setting values. If the environment variable is still set, the correct value is written on the next startup and no action is needed. If it was removed before upgrading, the stored value stays incorrect and the warning message keeps omitting the message age until an administrator re-saves the affected setting under **Admin → Settings → Retention Policy**, which writes a valid value. This is not corrected automatically because stored setting values are only migrated in a major release.
