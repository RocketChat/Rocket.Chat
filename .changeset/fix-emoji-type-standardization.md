---
'@rocket.chat/core-typings': patch
'@rocket.chat/meteor': patch
---

Fixes the `IEmoji` type to reflect the real shape of custom emoji data, and standardizes the `emoji.list` entry types (native, custom, and alias) into a shared `IEmojiPackEntry` type, removing unsafe type casts.
