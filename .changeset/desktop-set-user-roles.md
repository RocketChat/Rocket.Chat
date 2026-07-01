---
'@rocket.chat/desktop-api': minor
'@rocket.chat/meteor': patch
---

Added a `setUserRoles` bridge method to the desktop API and pushed the logged-in user's roles to the desktop app. This lets the desktop client restrict supportedVersions messages (such as version-expiration warnings) to specific roles like admins, instead of showing them to every user. The push is reactive to role changes; desktop builds without the bridge method fall back to their own role lookup.
