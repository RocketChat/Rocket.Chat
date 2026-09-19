---
'@rocket.chat/tools': patch
---

Fixed `unescapeHTML` decoding astral (non-BMP) numeric entities such as `&#128512;` or `&#x1F600;` into a truncated character. It now uses `String.fromCodePoint` so emoji and other code points above U+FFFF decode correctly, while numeric entities above U+10FFFF are left untouched instead of throwing.
