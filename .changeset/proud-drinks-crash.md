---
"@rocket.chat/meteor": patch
---

fixes an issue where some apps that don't need permission would have grantedPermissions as null making it impossible to activate the app
