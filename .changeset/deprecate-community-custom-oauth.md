---
'@rocket.chat/meteor': minor
---

Deprecates Custom OAuth authentication on workspaces without a Premium plan. Custom OAuth services keep working as they are today, but their admin settings now warn that version 9.0.0 will require a license including the `oauth-enterprise` module, and a warning is logged when an unlicensed workspace authenticates a user through one of them.
