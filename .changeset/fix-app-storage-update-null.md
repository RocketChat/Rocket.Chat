---
'@rocket.chat/apps': patch
'@rocket.chat/meteor': patch
---

Fixes a type-safety bug where `AppMetadataStorage.updatePartialAndReturnDocument` was asserted to always return a document, even though `findOneAndUpdate` returns `null` when no matching document is found. The method now correctly returns `IAppStorageItem | null`, and callers that expect an update to have found a document now throw a clear error instead of silently continuing with a null result.
