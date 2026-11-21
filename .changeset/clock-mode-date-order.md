---
'@rocket.chat/ui-client': patch
'@rocket.chat/meteor': patch
---

Fixes dates shown with the time in English month-first order ("Oktober 31, 2026 14:05") for every language once a 12- or 24-hour clock is chosen in Accessibility & Appearance. The date now follows the user's language, as it does with the default clock.
