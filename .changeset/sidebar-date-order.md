---
'@rocket.chat/ui-client': patch
'@rocket.chat/meteor': patch
---

Fixes the date of older rooms in the sidebar being written in English month-first order with an English-style ordinal ("Okt. 20.", "oct 20º"). It now follows the user's language ("20. Okt.", "20 oct").
