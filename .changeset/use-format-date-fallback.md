---
"@rocket.chat/meteor": patch
---

Fixes a `date-fns` crash on routes that mount before the public settings stream finishes loading. `useFormatDate` was passing `String(undefined)` (the literal `"undefined"`) to `formatDate` while `Message_DateFormat` was momentarily unloaded — `date-fns` rejects that token because it contains an unescaped `n`. The hook now uses `'LL'` as the default token via `useSetting`'s second argument, so the formatter always receives a valid format string.
