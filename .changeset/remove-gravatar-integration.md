---
'@rocket.chat/meteor': major
'@rocket.chat/i18n': major
---

Removes the built-in Gravatar integration. New users and users setting their username for the first time no longer get an avatar silently fetched from gravatar.com based on their email address — a default-on outbound request that conflicted with privacy expectations on clean workspaces. Avatar resolution is now deterministic: an uploaded or OAuth-provided avatar is used when available, otherwise the initials avatar is shown. Users whose current avatar came from Gravatar keep their already-stored avatar image. Workspaces that still want Gravatar-based avatars can install the Gravatar app from the Marketplace as a replacement.
