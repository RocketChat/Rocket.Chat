---
'@rocket.chat/meteor': patch
---

Fixes the user bio in the Directory → Users table being clipped abruptly with no ellipsis, instead of truncating like the name and username columns next to it. `UsersTableRow` now renders the bio with `withTruncatedText` and the single-line `inlineWithoutBreaks` markdown variant, matching how topics are already truncated in the Channels and Teams directory tables.
