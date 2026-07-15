---
'@rocket.chat/meteor': minor
'@rocket.chat/license': minor
---

Added support for the `offline` license flag issued by Fleet Command. When the applied license carries this flag, the workspace no longer initiates any outbound connection to Rocket.Chat Cloud services or the Rocket.Chat Push Gateway: workspace sync (license sync and cloud announcements), supported-versions and version-update checks, marketplace requests (admin UI and scheduled jobs), usage/telemetry reports, NPS surveys, cloud OAuth token requests, and push gateway sends are all suppressed at the source. Default Gravatar avatar fetches and Gravatar avatar suggestions are suppressed as well (admin-configured OAuth provider avatars keep working). Interactive cloud actions (registration, cloud login, billing) fail fast with a clear error instead of attempting to connect. A single informational log entry is emitted when offline mode is detected. Cron jobs now start only after the license is applied, so scheduled jobs honor the flag from their very first run. Workspaces with standard licenses are unaffected.
