---
'@rocket.chat/meteor': patch
'@rocket.chat/i18n': patch
---

Fixed translation strings in 40 locales that rendered stale markup or literal `%s` placeholders, and added `eloqnt lint` to the i18n package's lint script to catch such errors
