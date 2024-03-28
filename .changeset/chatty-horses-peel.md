---
"@rocket.chat/meteor": patch
---

**Fixed enterprise settings value not being updated when license is removed or invalid**

Added a license callbacks `onRemoveLicense` and `onInvalidateLicense` to update enterprise settings values when a license is removed/invalid.
This solves a specific scenario where in case of a downgrade (license removal), `settings.get` would continue to return `value` for enterprise settings instead of `invalidValue` as it should. 
This would remain the case until the workspace was restarted.
