---
"@rocket.chat/core-typings": patch
"@rocket.chat/meteor": patch
---

fix: narrow IModerationReport `ts` type from `Date | string` to `Date` to resolve AJV oneOf validation failure
