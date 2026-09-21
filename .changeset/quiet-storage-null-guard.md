---
'@rocket.chat/meteor': patch
---

Fixes a crash in the Enterprise Apps manager when an app's storage record is updated at the exact moment it no longer exists (for example, removed mid-migrate or mid-update). `AppRealStorage.updatePartialAndReturnDocument()` asserted that MongoDB's `findOneAndUpdate()` always returns a document, when it actually returns `null` if nothing matches. That `null` was then passed into code that assumed a real app record, causing an unrelated `TypeError` deep inside `AppManager` instead of a clear error. The storage layer now reports `null` honestly, and `AppManager` throws a specific "app no longer exists" error at the two call sites that need one.
