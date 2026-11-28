---
'@rocket.chat/ui-client': patch
'@rocket.chat/meteor': patch
---

Fixes choosing a 12- or 24-hour clock in Accessibility & Appearance switching every date shown with the time to English month-first order ("Oktober 31, 2026 14:05"). The clock now changes only the time; the date keeps the format it has with the default clock.
